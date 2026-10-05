# GDGoC UNAIR Web-Dev

## Current Run & Test Paths
- **Frontend App:** Located in `apps/web/`. Run `npm run dev` from the root.
- **Root Scripts:** `npm run build`, `npm run test` (runs workspaces tests + Playwright e2e), `npm run lint`.
- **Examples:** Stub backends are located in `examples/`.

## Known Limits
- **Vulnerabilities:** 10 untriaged npm audit findings (dev-only via `live-server` in original structure).
- **Security:** `innerHTML` used in tutorial live-edit poses a local XSS risk.
- **CI/CD:** No Continuous Integration (CI) pipeline setup yet.
