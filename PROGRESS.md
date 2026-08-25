# Dayflow Integrations Progress

## Goal

Make Dayflow a local-first personal hub that can reconcile tasks and calendar blocks with Notion and Google Calendar, without paid APIs or recurring infrastructure costs.

## Current status

- [x] Local-first app with tasks, planner blocks, settings, export/import and backups.
- [x] `TimeBlock` already has `googleEventId` and `isGoogleEvent` fields.
- [x] Google Calendar OAuth and event create/update/delete endpoints.
- [x] Notion task create/update/delete endpoints and manual import.
- [x] Sync status, errors and manual import controls in Settings.
- [ ] Durable sync metadata and conflict handling.

## Implementation order

1. **Free local sync service** (implemented)
   - Node service using only built-in modules and SQLite-compatible JSON state.
   - Optional Google and Notion credentials through environment variables.
   - Health/status endpoint and idempotent sync endpoints.
2. **Google Calendar** (initial implementation)
   - OAuth authorization flow.
   - [x] Import events into Planner manually.
   - [x] Create, update and delete events from Planner.
   - [x] Preserve external IDs and avoid duplicates.
   - [ ] Incremental background pull using Google sync tokens.
3. **Notion tasks** (initial implementation)
   - [x] Map a shared Notion database to Dayflow tasks.
   - [x] Import remote tasks and deduplicate local tasks.
   - [x] Push local task changes with stable page IDs.
   - [ ] Map custom status, priority and category properties.
4. **Product hardening** (remaining)
   - Sync status and last error in Settings.
   - Retry-safe operations and conflict visibility.
   - Timezone, deleted-item and token-expiration handling.
5. **Validation and documentation**
   - [x] Local Docker setup and OAuth/Notion instructions.
   - [x] TypeScript, syntax and health endpoint checks.
   - [ ] Full build/lint after reinstalling incomplete native npm optional dependencies.

## Cost model

The integrations use the free Google Calendar and Notion APIs. The sync service runs locally with Docker or directly with Node, so no paid hosting is required. Google Cloud may ask for a project and OAuth consent configuration, but normal personal API usage does not require a paid API plan.

## Acceptance criteria

- Dayflow remains usable with integrations disabled.
- A Planner block can be created, edited and deleted without creating duplicate Google events.
- Existing Google events can be imported into the Planner after authorization.
- Tasks can be imported from and pushed to one configured Notion database.
- Tokens and integration secrets are never committed or stored in the browser.
- A failed sync is visible and retryable without losing local data.