# 09 — Testing Strategy

Goal: meaningful tests that prove behavior, not a coverage number. Report real pass/fail output only.

## Mobile (Jest + `jest-expo` + React Native Testing Library)
| Layer | What | Examples |
|---|---|---|
| Unit | pure logic | cart store (add/merge/remove/quantity limits/persist migration), `money.ts`, error mapping, debounce |
| Component | rendering + interaction | ProductCard states, QuantityStepper bounds, Banner role, TextField errors |
| Screen/integration | screen with mocked `src/api` | Home loads/paginates/empty/error; Cart offline banner + disabled checkout; Checkout validation and double-submit lock |
| Locale | both directions | key screens render with `ar` and `en`; missing-key test fails if a key exists in one file only |
Rules: mock at `src/api` boundary (not inside components); no snapshot tests except tiny stable ones; use `findBy*` for async; test offline by mocking NetInfo.

## Backend (Medusa integration tests)
Use Medusa's integration test runner (`medusaIntegrationTestRunner` from `@medusajs/test-utils`) with a real test database: wishlist routes — unauthenticated 401, create/idempotent add, delete own item, cannot touch another customer's item, validation 400 on bad body.

## Quality gates (CI — GitHub Actions)
On push/PR: install, `tsc --noEmit`, lint, `jest` (mobile); backend: build + integration tests if a Postgres service is configured. Add a status badge to the README only after CI runs green.

## Manual verification checklist (record results with date and device)
- [ ] Fresh install → seeded catalog loads on a phone
- [ ] Airplane mode: browse cached list, edit cart, checkout disabled
- [ ] Restart app: cart restored
- [ ] Switch ar↔en: direction and strings correct, no clipped text at 130% font scale
- [ ] Full test checkout completes; order visible in Medusa Admin
- [ ] TalkBack/VoiceOver pass on Home, Product, Cart
- [ ] Slow network (throttled): lists usable, no crashes
