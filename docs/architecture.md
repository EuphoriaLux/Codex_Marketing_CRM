# Crush Hub Architecture

## Goal

Build a customer-facing hub that extends `Crush.lu` without forcing a copied website stack. The hub should give clients, partners, and project contacts a single authenticated interface for:

- account/profile management
- support or service requests
- shared resources and project documents
- future customer workflows such as approvals, invoices, onboarding, or campaign reporting

## Recommended integration shape

The current recommendation is:

- build the customer interface as a standalone Next.js frontend
- plug in a backend later, with Django as a strong candidate
- connect the two through explicit API contracts

This avoids building a second server-rendered website while still keeping the backend flexible.

### Frontend-first shape

- `crush.lu`: marketing or main website
- `hub.crush.lu`: dedicated Next.js customer portal
- future backend: API, auth, admin, permissions, workflow logic

### If the existing site is already Django

Use the same backend instance where possible.

- Keep one backend for data and business rules.
- Expose hub APIs such as `/api/hub/me`, `/api/hub/requests`, and `/api/hub/resources`.
- Let Next.js own the customer UI and routing.
- Reuse the existing auth and admin layer instead of duplicating them in a second web stack.

## Domain model in this starter

The frontend is already organized around these backend entities:

- `CustomerProfile`: customer/account metadata
- `SupportRequest`: first workflow for customer interaction and case tracking
- `SharedResource`: links to files, guides, and account resources

## Recommended next modules

- `ProjectWorkspace`: per-customer project or retainer visibility
- `InvoiceSnapshot`: billing summaries pulled from the accounting system
- `ApprovalTask`: customer sign-off for deliverables or changes
- `ActivityFeed`: timeline of actions visible to staff and customers

## Authentication

For the first release:

- keep authentication server-side in the backend
- let Next.js consume authenticated endpoints
- start with invited users managed by staff

For a stronger second phase:

- Azure Entra External ID or social login for invited customers
- optional role-based access for client admin vs project contact

## Azure fit

The frontend-first version fits Azure with:

- Azure Static Web Apps or a small App Service for Next.js
- Azure App Service for backend APIs
- Azure Database for PostgreSQL for production data when needed
- Azure Blob Storage later if you want customer-uploaded assets

This keeps the operating model simple and avoids duplicating the backend just to get a dedicated customer UI.
