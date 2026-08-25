# Dayflow

Dayflow is a local-first personal productivity app. The optional sync service connects Planner blocks to Google Calendar and Tasks to a Notion database using their free APIs.

## Local development

```bash
npm install
cp .env.example .env
npm run sync
npm run dev
```

Open `http://localhost:5173`. Dayflow works without the sync service; integrations become active after configuring `.env`.

## Google Calendar setup

1. Create a project in Google Cloud Console and enable Google Calendar API.
2. Create an OAuth client for a web application.
3. Add `http://localhost:8787/auth/google/callback` as an authorized redirect URI.
4. Put the client ID and secret in `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
5. Open Settings in Dayflow and connect Google Calendar.

The server keeps OAuth tokens in ignored local storage under `server/data/`. Do not commit `.env` or that directory.

## Notion setup

1. Create an internal Notion integration and copy its token to `NOTION_TOKEN`.
2. Create a Notion database with a title property named `Name` (or set `NOTION_TITLE_PROPERTY`).
3. Share that database with the integration.
4. Copy the database ID to `NOTION_DATABASE_ID`.

New and edited Dayflow tasks are upserted into that database. The current sync keeps Dayflow usable offline and never deletes local data when an external request fails.

## Docker

```bash
cp .env.example .env
docker compose up --build
```

The frontend is available on `http://localhost:8080` and the local sync service on `http://localhost:8787`.

See [PROGRESS.md](PROGRESS.md) for the implementation roadmap and remaining work.

## Project template notes

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:
daily commit wow, another daily commit. Another day, another larp. Just one more commit for larping haha. Need this commit for daily commit
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
