# 08 — Security Baseline

Scope: a portfolio app with test data. Apply the baseline anyway; do not claim a security audit.

## Mobile
- No secrets in the bundle: only `EXPO_PUBLIC_*` (URL + publishable key). Assume anything in the app can be extracted.
- Auth tokens in `expo-secure-store`, never AsyncStorage. Clear on logout.
- HTTPS for anything beyond local development; cleartext only for LAN dev.
- Validate input client-side (zod) for UX; the server remains the authority.
- No PII in logs; strip debug logging in release.
- Don't render untrusted HTML; no `eval`; no deep-link actions without validation of params.
- Keep dependencies current: `npm audit` reviewed before release; don't add packages without need.

## Backend (Medusa)
- Strong `JWT_SECRET` and `COOKIE_SECRET` (random, ≥32 chars), never the defaults; `.env` not committed.
- Configure CORS (`STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`) explicitly even if native apps are not bound by CORS.
- Custom routes: validate bodies with zod via Medusa middlewares; authenticate customer routes; derive identity from the auth context; return 404 (not 403) for other customers' resources; never trust IDs from the client.
- Admin user: strong password, local only. Disable/rotate seed credentials before any public deployment.
- Rate limiting and WAF belong at the hosting layer; note it as future work.
- Payments: test provider only; no card data touches this system.

## OWASP mapping (checklist to tick with evidence)
Mobile Top 10 relevant items: improper credential usage, insecure communication, insufficient input/output validation, insecure data storage, inadequate supply-chain security. For each, write one line in `docs/SECURITY-CHECKLIST.md`: what was done, how it was checked, or "not done".
