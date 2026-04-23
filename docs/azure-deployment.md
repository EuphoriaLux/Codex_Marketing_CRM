# Azure Low-Cost Deployment

## Recommended MVP topology

For April 21, 2026, the best low-cost setup for a frontend-first customer portal is:

1. Next.js frontend on Azure Static Web Apps
2. backend API on Azure App Service Linux, `B1` plan
3. Azure Database for PostgreSQL Flexible Server, burstable entry tier when production data is needed
4. Optional Azure Blob Storage only when customer file uploads become necessary

This is a better fit than building two server-side sites or over-engineering with AKS. It stays cheap and keeps the backend focused on API concerns.

## Static Web Apps frontend mode

For this repository as it exists now, the frontend should deploy to Azure Static Web Apps as a static export.

- Next.js is currently running as a client-heavy app rather than relying on server-side rendering.
- Static export keeps deployment simpler than the hybrid Next.js preview path.
- The frontend should call the Django API over HTTPS using `NEXT_PUBLIC_API_BASE_URL`.

The repository is configured for this with:

- `frontend/next.config.ts` using `output: "export"`
- `frontend/public/staticwebapp.config.json` for Static Web Apps settings
- `.github/workflows/azure-static-web-apps.yml` for GitHub-based deployment

## Why this is the right cost profile

- Static Web Apps is a strong low-cost home for the frontend.
- App Service `B1` is predictable and cheap for the always-on backend API.
- PostgreSQL Flexible Server burstable tier is enough for a small authenticated portal.
- The stack is simple enough to maintain without a dedicated DevOps layer.

## Frontend environment variables

Set these in the frontend deployment:

- `NEXT_PUBLIC_API_BASE_URL=https://api-or-app-host`

For production, prefer:

- `NEXT_PUBLIC_API_BASE_URL=https://api.crush.lu`

## Backend environment variables

Set these in Azure App Service:

- `SECRET_KEY`
- `DEBUG=False`
- `ALLOWED_HOSTS=api.crush.lu,<app-service-hostname>`
- `CSRF_TRUSTED_ORIGINS=https://hub.crush.lu,https://api.crush.lu,https://<app-service-hostname>`
- `DATABASE_URL=postgres://...`
- `AZURE_APP_SERVICE=True`

These variables assume a Django backend later. If you choose another backend, the exact set will differ.

## Backend startup

If Django is chosen later, a typical App Service startup command would be:

```bash
python manage.py migrate && python manage.py collectstatic --noinput && gunicorn config.wsgi
```

## First deployment steps

1. Deploy the Next.js frontend to Azure Static Web Apps.
2. Create the backend App Service and PostgreSQL resources in the same Azure region.
3. Configure the environment variables above.
4. Complete backend bootstrap steps based on the framework you choose.
5. Point `hub.crush.lu` to the frontend and `api.crush.lu` or the App Service host to the backend.

### Static Web Apps setup notes

In Azure Static Web Apps:

1. Connect the GitHub repository.
2. Set the app location to `frontend`.
3. Set the output location to `out`.
4. Add the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret in GitHub if Azure does not create it automatically.
5. Add `NEXT_PUBLIC_API_BASE_URL` in the Static Web Apps environment settings.

## When to upgrade

Upgrade only after demand proves it:

- move backend media to Blob Storage when uploads become part of the workflow
- add Azure Cache for Redis only if sessions or traffic justify it
- add Entra External ID only when invitation-based identity becomes a business need
