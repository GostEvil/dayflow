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
let oauthStates = new Set();

async function readState() {
  try { return JSON.parse(await fs.readFile(stateFile, 'utf8')); }
  catch { return { googleTokens: null, sync: { lastSyncAt: null, lastError: null } }; }
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
  if (!response.ok) throw new Error(data.error?.message || data.error_description || `Google request failed (${response.status})`);
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
    oauthStates.add(state);
    const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri, response_type: 'code', access_type: 'offline', prompt: 'consent', scope: 'https://www.googleapis.com/auth/calendar', state });
    res.writeHead(302, { location: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
    return res.end();
  }

  if (req.method === 'GET' && url.pathname === '/auth/google/callback') {
    const stateParam = url.searchParams.get('state');
    const code = url.searchParams.get('code');
    if (!code || !stateParam || !oauthStates.delete(stateParam)) return send(res, 400, { error: 'Invalid OAuth callback' });
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

  if (req.method === 'POST' && url.pathname === '/api/google/events') {
    try {
      const block = await readBody(req);
      const state = await readState();
      const token = await googleAccessToken(state);
      const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || 'primary');
      const externalId = block.googleEventId;
      const target = externalId ? `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(externalId)}` : `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;
      const result = await googleRequest(target, { method: externalId ? 'PUT' : 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(eventPayload(block)) });
      state.sync = { lastSyncAt: new Date().toISOString(), lastError: null };
      await writeState(state);
      return send(res, 200, { googleEventId: result.id, etag: result.etag });
    } catch (error) { const state = await readState(); state.sync.lastError = error.message; await writeState(state); return send(res, 502, { error: error.message }); }
  }

  if (req.method === 'GET' && url.pathname === '/api/google/events') {
    try {
      const state = await readState();
      const token = await googleAccessToken(state);
      const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || 'primary');
      const params = new URLSearchParams({ singleEvents: 'true', orderBy: 'startTime', timeMin: new Date().toISOString(), timeMax: new Date(Date.now() + 90 * 86400000).toISOString() });
      const result = await googleRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params}`, { headers: { authorization: `Bearer ${token}` } });
      return send(res, 200, { events: result.items || [] });
    } catch (error) { return send(res, 502, { error: error.message }); }
  }

  if (req.method === 'POST' && url.pathname === '/api/notion/tasks') {
    if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) return send(res, 400, { error: 'Set NOTION_TOKEN and NOTION_DATABASE_ID first' });
    try {
      const task = await readBody(req);
      const result = await syncNotionTask(task);
      return send(res, 200, { notionPageId: result.id });
    } catch (error) { return send(res, 502, { error: error.message }); }
  }

  if (req.method === 'GET' && url.pathname === '/api/notion/tasks') {
    if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) return send(res, 400, { error: 'Set NOTION_TOKEN and NOTION_DATABASE_ID first' });
    try {
      const result = await googleRequest(`https://api.notion.com/v1/databases/${encodeURIComponent(process.env.NOTION_DATABASE_ID)}/query`, { method: 'POST', headers: notionHeaders(), body: JSON.stringify({ page_size: 100 }) });
      return send(res, 200, { pages: result.results || [] });
    } catch (error) { return send(res, 502, { error: error.message }); }
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/notion/tasks/')) {
    if (!process.env.NOTION_TOKEN) return send(res, 400, { error: 'Set NOTION_TOKEN first' });
    try {
      await googleRequest(`https://api.notion.com/v1/blocks/${encodeURIComponent(url.pathname.split('/').pop())}`, { method: 'DELETE', headers: notionHeaders() });
      return send(res, 200, { ok: true });
    } catch (error) { return send(res, 502, { error: error.message }); }
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/google/events/')) {
    try {
      const state = await readState();
      const token = await googleAccessToken(state);
      const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || 'primary');
      await googleRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(url.pathname.split('/').pop())}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
      state.sync = { lastSyncAt: new Date().toISOString(), lastError: null };
      await writeState(state);
      return send(res, 200, { ok: true });
    } catch (error) { return send(res, 502, { error: error.message }); }
  }

  return send(res, 404, { error: 'Not found' });
}

http.createServer((req, res) => handle(req, res).catch(error => send(res, 500, { error: error.message }))).listen(port, () => console.log(`Dayflow sync service listening on http://localhost:${port}`));