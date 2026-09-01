import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.SYNC_PORT || 8787);
const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, 'data');
const stateFile = path.join(dataDir, 'sync-state.json');
const redirectUri = process.env.GOOGLE_REDIRECT_URI || `http://localhost:${port}/auth/google/callback`;
let oauthStates = new Map(); // state -> timestamp

function addOauthState(state) {
  if (oauthStates.size > 100) oauthStates.clear();
  oauthStates.set(state, Date.now());
}

function verifyOauthState(state) {
  if (!state || !oauthStates.has(state)) return false;
  const time = oauthStates.get(state);
  oauthStates.delete(state);
  return Date.now() - time < 3600000; // 1 hour expiration
}
function defaultSyncChannel() {
  return { lastAttemptAt: null, lastSuccessAt: null, lastError: null };
}

function defaultState() {
  return {
    googleTokens: null,
    stravaTokens: null,
    sync: {
      lastSyncAt: null,
      lastError: null,
      lastErrorAt: null,
      lastSource: null,
      conflicts: {
        google: { count: 0, lastAt: null, lastMessage: null, lastEntityId: null },
        notion: { count: 0, lastAt: null, lastMessage: null, lastEntityId: null },
      },
      google: defaultSyncChannel(),
      notion: defaultSyncChannel(),
    },
  };
}

function normalizeState(rawState) {
  const fallback = defaultState();
  const sync = rawState?.sync || {};
  return {
    ...fallback,
    ...rawState,
    sync: {
      ...fallback.sync,
      ...sync,
      conflicts: {
        ...fallback.sync.conflicts,
        ...(sync.conflicts || {}),
        google: { ...fallback.sync.conflicts.google, ...(sync.conflicts?.google || {}) },
        notion: { ...fallback.sync.conflicts.notion, ...(sync.conflicts?.notion || {}) },
      },
      google: { ...fallback.sync.google, ...(sync.google || {}) },
      notion: { ...fallback.sync.notion, ...(sync.notion || {}) },
    },
  };
}

function newHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function markSyncSuccess(state, source) {
  const at = new Date().toISOString();
  state.sync.lastSyncAt = at;
  state.sync.lastError = null;
  state.sync.lastErrorAt = null;
  state.sync.lastSource = source;
  state.sync[source].lastAttemptAt = at;
  state.sync[source].lastSuccessAt = at;
  state.sync[source].lastError = null;
}

function markSyncError(state, source, errorMessage) {
  const at = new Date().toISOString();
  state.sync.lastError = errorMessage;
  state.sync.lastErrorAt = at;
  state.sync.lastSource = source;
  state.sync[source].lastAttemptAt = at;
  state.sync[source].lastError = errorMessage;
}

function markSyncConflict(state, source, errorMessage, entityId) {
  markSyncError(state, source, errorMessage);
  state.sync.conflicts[source].count += 1;
  state.sync.conflicts[source].lastAt = state.sync.lastErrorAt;
  state.sync.conflicts[source].lastMessage = errorMessage;
  state.sync.conflicts[source].lastEntityId = entityId || null;
}

async function readState() {
  try { return normalizeState(JSON.parse(await fs.readFile(stateFile, 'utf8'))); }
  catch { return defaultState(); }
}

async function writeState(state) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': process.env.FRONTEND_ORIGIN || 'http://localhost:5173', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS' });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return body ? JSON.parse(body) : {};
}

function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

async function googleRequest(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error?.message || data.error_description || `Google request failed (${response.status})`;
    throw newHttpError(response.status, message);
  }
  return data;
}

async function googleAccessToken(state) {
  if (!state.googleTokens) throw new Error('Google Calendar is not connected');
  if (state.googleTokens.expiresAt > Date.now() + 60000) return state.googleTokens.accessToken;
  if (!state.googleTokens.refreshToken) throw new Error('Google session expired; reconnect required');
  const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: state.googleTokens.refreshToken, grant_type: 'refresh_token' });
  const token = await googleRequest('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: params });
  state.googleTokens = { ...state.googleTokens, accessToken: token.access_token, expiresAt: Date.now() + token.expires_in * 1000 };
  await writeState(state);
  return token.access_token;
}

async function stravaAccessToken(state) {
  if (!state.stravaTokens) throw new Error('Strava is not connected');
  if (state.stravaTokens.expiresAt > Date.now() + 60000) return state.stravaTokens.accessToken;
  if (!state.stravaTokens.refreshToken) throw new Error('Strava session expired; reconnect required');
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    refresh_token: state.stravaTokens.refreshToken,
    grant_type: 'refresh_token'
  });
  
  const response = await fetch('https://www.strava.com/oauth/token', { method: 'POST', body: params });
  const token = await response.json();
  if (!response.ok) throw new Error(token.message || 'Failed to refresh Strava token');

  state.stravaTokens = {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: token.expires_at * 1000 // Strava gives expires_at in seconds since epoch
  };
  await writeState(state);
  return token.access_token;
}

function eventPayload(block) {
  const timezone = process.env.GOOGLE_TIMEZONE || 'UTC';
  return { summary: block.title, description: `Dayflow block ${block.id}`, start: { dateTime: `${block.date}T${block.startTime}:00`, timeZone: timezone }, end: { dateTime: `${block.date}T${block.endTime}:00`, timeZone: timezone }, extendedProperties: { private: { dayflowId: block.id } } };
}

function notionHeaders() {
  return { authorization: `Bearer ${process.env.NOTION_TOKEN}`, 'content-type': 'application/json', 'Notion-Version': '2022-06-28' };
}

function notionProperties(task) {
  const titleProperty = process.env.NOTION_TITLE_PROPERTY || 'Name';
  const properties = { [titleProperty]: { title: [{ text: { content: task.title } }] } };
  if (task.description) properties.Description = { rich_text: [{ text: { content: task.description.slice(0, 2000) } }] };
  if (task.dueDate) properties.Due = { date: { start: task.dueDate } };
  return properties;
}

async function syncNotionTask(task) {
  const target = task.notionPageId ? `https://api.notion.com/v1/pages/${encodeURIComponent(task.notionPageId)}` : 'https://api.notion.com/v1/pages';
  const body = task.notionPageId ? { properties: notionProperties(task) } : { parent: { database_id: process.env.NOTION_DATABASE_ID }, properties: notionProperties(task) };
  return googleRequest(target, { method: task.notionPageId ? 'PATCH' : 'POST', headers: notionHeaders(), body: JSON.stringify(body) });
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (url.pathname === '/health') return send(res, 200, { ok: true, service: 'dayflow-sync' });

  if (req.method === 'GET' && url.pathname === '/api/sync/status') {
    const state = await readState();
    return send(res, 200, { google: { configured: googleConfigured(), connected: Boolean(state.googleTokens) }, notion: { configured: Boolean(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID) }, sync: state.sync });
  }

  if (req.method === 'GET' && url.pathname === '/auth/google') {
    if (!googleConfigured()) return send(res, 400, { error: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first' });
    const state = crypto.randomBytes(24).toString('hex');
    addOauthState(state);
    const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri, response_type: 'code', access_type: 'offline', prompt: 'consent', scope: 'https://www.googleapis.com/auth/calendar', state });
    res.writeHead(302, { location: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
    return res.end();
  }

  if (req.method === 'GET' && url.pathname === '/auth/google/callback') {
    const stateParam = url.searchParams.get('state');
    const code = url.searchParams.get('code');
    if (!code || !verifyOauthState(stateParam)) return send(res, 400, { error: 'Invalid OAuth callback or state expired' });
    try {
      const params = new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: 'authorization_code' });
      const token = await googleRequest('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: params });
      const current = await readState();
      current.googleTokens = { accessToken: token.access_token, refreshToken: token.refresh_token || current.googleTokens?.refreshToken || null, expiresAt: Date.now() + token.expires_in * 1000, scope: token.scope || '' };
      await writeState(current);
      res.writeHead(302, { location: process.env.FRONTEND_URL || 'http://localhost:5173/settings?google=connected' });
      return res.end();
    } catch (error) { return send(res, 502, { error: error.message }); }
  }

  if (req.method === 'GET' && url.pathname === '/auth/strava') {
    if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) return send(res, 400, { error: 'Set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET in .env first' });
    const redirectUrl = `http://localhost:${port}/auth/strava/callback`;
    const state = crypto.randomBytes(24).toString('hex');
    addOauthState(state);
    const params = new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID,
      redirect_uri: redirectUrl,
      response_type: 'code',
      scope: 'activity:read_all',
      state
    });
    res.writeHead(302, { location: `https://www.strava.com/oauth/authorize?${params}` });
    return res.end();
  }

  if (req.method === 'GET' && url.pathname === '/auth/strava/callback') {
    const stateParam = url.searchParams.get('state');
    const code = url.searchParams.get('code');
    if (!code || !verifyOauthState(stateParam)) return send(res, 400, { error: 'Invalid OAuth callback or state expired' });
    try {
      const redirectUrl = `http://localhost:${port}/auth/strava/callback`;
      const params = new URLSearchParams({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      });
      const response = await fetch('https://www.strava.com/oauth/token', { method: 'POST', body: params });
      const token = await response.json();
      if (!response.ok) throw new Error(token.message || 'Failed to exchange Strava token');

      const current = await readState();
      current.stravaTokens = {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: token.expires_at * 1000
      };
      await writeState(current);
      res.writeHead(302, { location: process.env.FRONTEND_URL || 'http://localhost:5173/garmin' });
      return res.end();
    } catch (error) { return send(res, 502, { error: error.message }); }
  }

  if (req.method === 'POST' && url.pathname === '/api/google/events') {
    let block = {};
    try {
      block = await readBody(req);
      const state = await readState();
      const token = await googleAccessToken(state);
      const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || 'primary');
      const externalId = block.googleEventId;
      const target = externalId ? `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(externalId)}` : `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;
      const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
      if (externalId && block.ifMatchEtag) headers['if-match'] = block.ifMatchEtag;
      const result = await googleRequest(target, { method: externalId ? 'PUT' : 'POST', headers, body: JSON.stringify(eventPayload(block)) });
      markSyncSuccess(state, 'google');
      await writeState(state);
      return send(res, 200, { googleEventId: result.id, etag: result.etag });
    } catch (error) {
      const state = await readState();
      if (error.status === 412) {
        markSyncConflict(state, 'google', 'Google event changed remotely (etag mismatch). Refresh/import before retrying.', block.googleEventId || block.id || null);
        await writeState(state);
        return send(res, 409, { error: state.sync.lastError, code: 'GOOGLE_ETAG_CONFLICT' });
      }
      markSyncError(state, 'google', error.message);
      await writeState(state);
      return send(res, 502, { error: error.message });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/google/events') {
    try {
      const state = await readState();
      const token = await googleAccessToken(state);
      const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || 'primary');
      const params = new URLSearchParams({
        singleEvents: 'true',
        orderBy: 'startTime',
        showDeleted: 'true',
        timeMin: new Date(Date.now() - 30 * 86400000).toISOString(),
        timeMax: new Date(Date.now() + 90 * 86400000).toISOString(),
      });
      const result = await googleRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params}`, { headers: { authorization: `Bearer ${token}` } });
      markSyncSuccess(state, 'google');
      await writeState(state);
      return send(res, 200, { events: result.items || [] });
    } catch (error) {
      const state = await readState();
      markSyncError(state, 'google', error.message);
      await writeState(state);
      return send(res, 502, { error: error.message });
    }
  }

// Global Garmin Client to reuse session and prevent rate limits
let globalGarminClient = null;

async function getGarminClient() {
  if (globalGarminClient) return globalGarminClient;
  if (!process.env.GARMIN_USERNAME || !process.env.GARMIN_PASSWORD) return null;
  
  const gc = await import('garmin-connect');
  const GarminConnect = gc.default.GarminConnect || gc.GarminConnect;
  globalGarminClient = new GarminConnect({ username: process.env.GARMIN_USERNAME, password: process.env.GARMIN_PASSWORD });
  await globalGarminClient.login();
  return globalGarminClient;
}

  if (req.method === 'GET' && url.pathname === '/api/garmin/summary') {
    let garminData = { profile: null, sleep: null, steps: null, hr: null, activities: null };
    let stravaActivities = null;
    let garminError = null;
    let stravaError = null;

    // 1. Fetch Garmin Data (if credentials exist)
    if (process.env.GARMIN_USERNAME && process.env.GARMIN_PASSWORD) {
      try {
        const GCClient = await getGarminClient();
        if (GCClient) {
          const date = new Date();
          const [profile, sleep, steps, hr, activities] = await Promise.all([
            GCClient.getUserProfile().catch(e => { console.error('Profile Error:', e.message); return null; }),
            GCClient.getSleepData(date).catch(e => { console.error('Sleep Error:', e.message); return null; }),
            GCClient.getSteps(date).catch(e => { console.error('Steps Error:', e.message); return null; }),
            GCClient.getHeartRate(date).catch(e => { console.error('HR Error:', e.message); return null; }),
            GCClient.getActivities(0, 5).catch(e => { console.error('Activities Error:', e.message); return null; })
          ]);
          garminData = { profile, sleep, steps, hr, activities };
          console.log('Garmin sync completed.');
        }
      } catch (error) {
        console.error('Garmin API error (login failed or rate limited):', error.message);
        garminError = error.message;
        globalGarminClient = null; // reset client on login failure
      }
    }

    // 2. Fetch Strava Data (if connected)
    const state = await readState();
    if (state.stravaTokens) {
      try {
        const token = await stravaAccessToken(state);
        const res = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=5', {
          headers: { authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          stravaActivities = await res.json();
          console.log('Strava sync completed.');
        } else {
          stravaError = 'Failed to fetch Strava activities';
        }
      } catch (error) {
        console.error('Strava API error:', error.message);
        stravaError = error.message;
      }
    }

    return send(res, 200, {
      ...garminData,
      stravaActivities,
      errors: {
        garmin: garminError,
        strava: stravaError,
        stravaConnected: Boolean(state.stravaTokens)
      }
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/notion/tasks') {
    if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) return send(res, 400, { error: 'Set NOTION_TOKEN and NOTION_DATABASE_ID first' });
    try {
      const task = await readBody(req);
      const state = await readState();
      const result = await syncNotionTask(task);
      markSyncSuccess(state, 'notion');
      await writeState(state);
      return send(res, 200, { notionPageId: result.id });
    } catch (error) {
      const state = await readState();
      markSyncError(state, 'notion', error.message);
      await writeState(state);
      return send(res, 502, { error: error.message });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/notion/tasks') {
    if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) return send(res, 400, { error: 'Set NOTION_TOKEN and NOTION_DATABASE_ID first' });
    try {
      const state = await readState();
      const result = await googleRequest(`https://api.notion.com/v1/databases/${encodeURIComponent(process.env.NOTION_DATABASE_ID)}/query`, { method: 'POST', headers: notionHeaders(), body: JSON.stringify({ page_size: 100 }) });
      markSyncSuccess(state, 'notion');
      await writeState(state);
      return send(res, 200, { pages: result.results || [] });
    } catch (error) {
      const state = await readState();
      markSyncError(state, 'notion', error.message);
      await writeState(state);
      return send(res, 502, { error: error.message });
    }
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/notion/tasks/')) {
    if (!process.env.NOTION_TOKEN) return send(res, 400, { error: 'Set NOTION_TOKEN first' });
    try {
      const state = await readState();
      await googleRequest(`https://api.notion.com/v1/blocks/${encodeURIComponent(url.pathname.split('/').pop())}`, { method: 'DELETE', headers: notionHeaders() });
      markSyncSuccess(state, 'notion');
      await writeState(state);
      return send(res, 200, { ok: true });
    } catch (error) {
      const state = await readState();
      markSyncError(state, 'notion', error.message);
      await writeState(state);
      return send(res, 502, { error: error.message });
    }
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/google/events/')) {
    try {
      const state = await readState();
      const token = await googleAccessToken(state);
      const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || 'primary');
      await googleRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(url.pathname.split('/').pop())}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
      markSyncSuccess(state, 'google');
      await writeState(state);
      return send(res, 200, { ok: true });
    } catch (error) {
      const state = await readState();
      markSyncError(state, 'google', error.message);
      await writeState(state);
      return send(res, 502, { error: error.message });
    }
  }

  return send(res, 404, { error: 'Not found' });
}

http.createServer((req, res) => handle(req, res).catch(error => send(res, 500, { error: error.message }))).listen(port, () => console.log(`Dayflow sync service listening on http://localhost:${port}`));