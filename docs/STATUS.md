# STATUS — updated 2026-10-28 (after the Windows agent session)

This file separates three levels of evidence. Do not read "Implemented" as "works end to end".

- **Verified** — a command was run and its real result was observed.
- **Implemented** — code exists (per the agent's session log), but no run proves the behavior.
- **Not verified / Not done** — nothing ran, or nothing exists yet.

> Source note: the M3–M5 rows below come from the coding agent's session log on the owner's Windows machine (`E:\Khafif-Application`). The log was reviewed, but the code itself was not re-inspected in this update. Re-run the commands in "Re-verification checklist" before relying on any row.

## Milestones

| Milestone | State | Evidence and gaps |
|---|---|---|
| **M0 Setup** | **Done** | Medusa 2.22.1 + Expo SDK 58 scaffolded, versions in `VERSIONS.md`. On the owner's machine the project lives in `E:\Khafif-Application` (not `C:\khafif`) and the working copy has **no `.git`**. Dependencies were installed after an `ECONNRESET` and a conflict caused by two parallel `npm` installs; later `tsc`/`jest`/`lint` runs show the install completed. No local `.env` exists. Docker Desktop is installed but its daemon was **not running**. |
| **M1 Backend data** | **Verified (sandbox only)** | In a Linux sandbox with local PostgreSQL 16: clean-DB `npm run seed` creates region (ILS), channel + publishable key, stock location, 2 shipping options, 4 categories, 16 products (~100 KB of images); a second run creates nothing. Node smoke test: paginated list, search `thyme`, categories, image 200, variant price and stock, and **cart -> shipping -> payment -> complete = order, total 90 ILS**. **Not re-run on the owner's machine** (no Docker daemon, no `.env`). |
| **M2 App shell** | **Verified** | Sandbox: `tsc`, lint, Jest 26/26, Android Hermes bundle, web render in ar (RTL) and en (LTR). Owner's machine: the agent reproduced Jest 26 passing (cold run about 118 s; an earlier 2-minute timeout was only a short timeout, not a hang). **Not verified on a phone or emulator**: NetInfo reachability, fonts, native RTL feel, tab-label clipping seen on web. |
| **M3 Catalog** | **Implemented** | Per the agent log: product list from Medusa (page size 12, search debounced 400 ms, category filter), product detail with variants, `expo-image`, TanStack Query persisted cache for catalog keys. No evidence in the log of dedicated catalog tests or of running it against a live backend. |
| **M4 Cart** | **Implemented, partly tested** | Per the agent log: Zustand cart persisted as `khafif.cart.v1`, merge by variant, stock-based quantity limits, local-first with Medusa sync when checkout starts. Cart/checkout logic tests: **10 cases passed** in a targeted run. Restart persistence and offline behavior **not verified on a device**. |
| **M5 Checkout** | **Implemented, not verified live** | Per the agent log: guest email + address form, flat shipping options from the backend, payment provider looked up at runtime (`pp_system_default`), single-submit lock, idempotency key on `complete`, confirmation screen using server-confirmed totals. Calls were checked against the installed 2.22.1 SDK **type definitions** (e.g. `complete(cartId, {}, headers)`), **not against a running server through the app**. The server-side flow itself is proven by the M1 smoke test. |
| **M6 Quality / CI** | **Done for the mobile app.** `tsc --noEmit`, `expo lint` and 38 Jest tests pass on GitHub Actions (workflow "Mobile checks", commit `42f09f0`, Node 24). Backend integration tests are not in CI. Lockfile fix: `7134ff9`. |
| **M7 Wishlist** | Not started | Optional stretch (custom Medusa module, routes, login). |

## Re-verification checklist (owner's machine, in this order)

1. Start Docker Desktop, then `docker compose -f infra/docker-compose.yml up -d`.
2. `apps/backend`: copy `.env.example` to `.env`, fill `JWT_SECRET`, `COOKIE_SECRET`, and set `BACKEND_URL` to the LAN IP **before** seeding. Then `npm install`, `npx medusa db:migrate`, create the admin user, `npm run seed`, `npm run dev`. Copy the printed `pk_...` key.
3. `apps/mobile`: copy `.env.example` to `.env` (LAN IP URL + key), `npm install`, then run and record the real output of:
   `npx tsc --noEmit`, `npm run lint`, `npx jest`.
4. `npx expo start`; walk the full journey on the web build first, then on a phone through Expo Go: list -> detail -> add to cart -> change quantity -> checkout -> shipping -> test payment -> confirmation. Check the order in Medusa Admin.
5. Airplane-mode pass: cached list shows, cart editable, checkout disabled with an explanation. Restart the app: cart restored.
6. Switch ar <-> en: direction and strings correct, no clipped text at 130% font scale.
7. Done: "Mobile checks" is green on GitHub for commit 42f09f0.
## Known gaps and risks

- No end-to-end run of M3–M5 against a live backend through the app is on record.
- No physical-device verification at all (ADR-7 RTL approach, NetInfo, fonts, performance).
- `docs/PERFORMANCE.md` and `docs/SECURITY-CHECKLIST.md` do not exist yet. No performance number may be claimed until measured.
- `@medusajs/types` was added to `apps/mobile` (pinned to the Medusa version) and must be recorded in `VERSIONS.md`.
- Backend has no integration tests (only needed for M7).
- `npm audit` has not been reviewed.
- Shipping options that need a calculated price are intentionally not selectable (ADR-14).

## Next step

Run the re-verification checklist and paste the real outputs back into this file. Fix whatever fails. Then decide on M7.
