# 11 — Roadmap and Agent Prompts

Work **one milestone at a time**. Hours are rough estimates for an agent-assisted beginner, not promises. After each milestone: run the checks, commit, update `docs/VERSIONS.md`, and write the report in the format from `AGENTS.md`.

| # | Milestone | Deliverable | Est. |
|---|---|---|---|
| M0 | Setup | Repo, Postgres in Docker, Medusa running, publishable key, Expo app opens in Expo Go | 3–5 h |
| M1 | Backend data | Seed script: region, sales channel, stock location, 12–20 sample products (small images), 3–4 categories; products visible via Store API | 3–4 h |
| M2 | App shell | Providers (Query, i18n, fonts), tokens, tabs, `src/api/sdk.ts`, connectivity banner, ar/en + RTL switch | 4–6 h |
| M3 | Catalog | Home grid, infinite scroll, debounced search, category chips, product detail, cached offline | 5–7 h |
| M4 | Cart | Zustand cart (persisted), cart screen, badge, offline behavior, migration test | 3–4 h |
| M5 | Checkout | Full Medusa checkout sequence with test payment, validation, confirmation | 5–7 h |
| M6 | Quality | Tests per `09`, CI, accessibility pass, performance measurements, README with honest status | 4–6 h |
| M7 (stretch) | Wishlist | Custom module + routes + tests + login + wishlist UI | 6–10 h |

## Prompt templates (copy into the agent; replace `<…>`)

**Every session start**
> Read `AGENTS.md` and the docs it lists. We are on milestone `<M#>`. Restate the acceptance criteria in your own words, list the files you will touch, then implement. Check the official Expo/Medusa docs before using any API. Do not add features beyond the milestone.

**M0**
> Set up the repo structure from `AGENTS.md`. Create `infra/docker-compose.yml`, scaffold Medusa with `create-medusa-app@latest` and Expo with `create-expo-app@latest`, record installed versions in `docs/VERSIONS.md`, and give me exact commands for each manual step (admin user, publishable key). Stop when the Expo app opens in Expo Go and `GET /store/products` is reachable from my phone's network. Report what you ran.

**M1**
> Adapt the Medusa seed script (read the docs for the current seed approach) to create one region, one sales channel linked to a publishable key, a stock location with inventory, 3–4 categories and 12–20 sample products with small optimized images. Make it re-runnable. Show the `curl` I can run to verify.

**M2**
> Build the app shell per `01-ARCHITECTURE.md` and `05-DESIGN-SYSTEM.md`: fonts, tokens, i18n (ar/en, Arabic default), `I18nManager` handling with a reload, bottom tabs, `src/api/sdk.ts`, NetInfo → `onlineManager`, and the offline Banner. Add unit tests for the i18n key parity and the connectivity hook.

**M3**
> Implement Home and Product detail per `06-UI-SCREENS.md`. Use `useInfiniteQuery`, debounced search, category filter, FlashList, `expo-image`, restricted `fields`, query persistence for catalog keys only. Each screen needs loading, empty, error, offline states and tests.

**M4**
> Implement the local-first cart with Zustand `persist`, versioned schema `khafif.cart.v1`, quantity limits, merge-by-variant, cart badge, and offline banner. Tests: store logic (including migration), cart screen states.

**M5**
> Implement checkout per the sequence in `01-ARCHITECTURE.md` using `sdk.store`. Verify each route against the Store API docs. Server totals are authoritative; lock the submit button; map errors via `src/api/errors.ts`; clear the local cart only after a successful complete. Test with the mocked API layer and manually against the backend.

**M6**
> Complete tests per `09-TESTING-STRATEGY.md`, add GitHub Actions (typecheck, lint, tests), run an accessibility pass, measure performance per `07` and write real numbers (or "not measured") to `docs/PERFORMANCE.md`, and update the README with an honest feature status table.

**M7**
> Build the `wishlist` Medusa module and Store routes per `03` and `04`, following the official Medusa docs for modules, migrations, middlewares and integration tests. Then add login (emailpass, token in SecureStore) and the wishlist UI.

## Review prompt (use after each milestone)
> Review the diff against `AGENTS.md` rules 1–12 and the milestone acceptance criteria. List violations, untested paths, and any claim in the docs that you did not verify by running code.
