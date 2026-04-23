# Crush Hub Frontend

Frontend-first Next.js workspace for the future `Crush Hub` customer portal.

## Why this exists

This app is meant to move the portal UX forward before the Django backend is connected.

- build the customer-facing interface independently
- validate information architecture and flows first
- plug Django in later through stable API contracts

## Planned backend contract

- `GET /hub/me`
- `PATCH /hub/me`
- `GET /hub/requests`
- `POST /hub/requests`
- `GET /hub/resources`

## Local start

```bash
npm install
npm run dev
```

## Folder structure

- `app/`: Next.js routes
- `components/`: reusable UI sections
- `lib/mock-data.ts`: temporary frontend data source
- `lib/api/`: fetch wrapper and future backend contracts
