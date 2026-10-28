# 00 — Project Brief

## Product
**Khafif (خفيف)** — a mobile storefront for people on weak or expensive mobile data. Arabic-first (RTL) with English. Browse a catalog, keep a cart that survives lost connection, and place a **test** order.

## Why this project exists
A portfolio piece that produces inspectable evidence for e-commerce web/mobile roles: React Native, Medusa, REST APIs, testing, performance on low bandwidth, accessibility, security basics.

## Users
- **Low-bandwidth shopper (Arabic):** needs fast lists, small images, a cart that does not vanish offline.
- **Bilingual shopper:** switches Arabic/English without layout breakage.

## MVP scope (must)
1. Product list: infinite scroll, search (debounced), category filter.
2. Product detail: images, variant selection, quantity, add to cart.
3. Cart: local-first (works offline), quantity edits, estimated total.
4. Checkout (online only): email + shipping address, shipping option, **test** payment (Medusa default/manual provider), order confirmation.
5. Language switch Arabic/English with correct RTL/LTR.
6. Visible connectivity state (offline banner) and stale-data indicator.

## Should (after the core flow works)
- Wishlist: custom Medusa module + Store API route + customer login (emailpass).
- Order history for logged-in customers.

## Non-goals
Real payments, push notifications, admin mobile app, multi-vendor, analytics/A-B testing, production hosting, SEO (mobile app), image CDN.

## Success criteria (testable)
- A fresh clone runs: backend seeded, app on a phone via Expo Go, full browse→cart→test-checkout flow.
- Cart survives app restart and airplane mode; cart syncs to Medusa only at checkout.
- All UI strings exist in `ar` and `en`; layout verified in both directions on at least one device/emulator.
- `tsc --noEmit`, lint, and tests pass in CI.
- Each screen handles loading / empty / error / offline.
- README states exactly what is implemented, demo-only, or missing.

## Constraints
Windows dev machine; Expo Go for device testing; free tools only; one developer.

## Sample data rule
Catalog is seeded sample data (olive oil, thyme, soap, honey...). Never present it as real inventory or real prices.
