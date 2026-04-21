# Codex_Marketing_CRM

Frontend-first starter for `Crush Hub`, a dedicated customer interface for `Crush.lu`.

## Current direction

The repository is now frontend-only. It contains a standalone Next.js customer portal so product and UX can move before a backend is connected.

## Included now

- `frontend/`: standalone Next.js customer portal workspace
- `docs/architecture.md`: integration options with a future backend
- `docs/azure-deployment.md`: low-cost Azure direction

## Frontend quick start

```bash
cd frontend
npm install
npm run dev
```

## Planned backend role

A future backend, likely Django, should later provide:

- authentication and account context
- customer request APIs
- shared resource APIs
- admin and business logic

## Core paths

- `frontend/app/`: Next.js routes
- `frontend/components/`: shared UI
- `frontend/lib/api/`: backend-ready API contracts
- `frontend/lib/mock-data.ts`: temporary frontend data source
