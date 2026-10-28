# 01 — System Architecture

## 1. Context
```mermaid
flowchart LR
  U[Shopper] --> APP[Expo app - React Native]
  APP -->|HTTPS REST + x-publishable-api-key| MED[Medusa v2 server]
  MED --> PG[(PostgreSQL)]
  MED -.optional.-> RD[(Redis)]
  MED --> FS[File storage - local in dev]
  APP --> LS[(AsyncStorage / SecureStore)]
  ADM[Medusa Admin dashboard] --> MED
  DEV[Developer] --> ADM
```

## 2. Mobile app layers
```mermaid
flowchart TB
  UI[Screens - Expo Router] --> F[Feature hooks]
  F --> Q[TanStack Query - server state, persisted cache]
  F --> Z[Zustand - cart, settings, persisted]
  Q --> API[api/ - Medusa JS SDK wrapper]
  Z --> ST[storage adapter]
  API --> NET[NetInfo / onlineManager]
```
Rules: screens never call the SDK directly; features talk to `src/api`; only `src/api` imports `@medusajs/js-sdk`. Components under `src/ui` have no business logic.

## 3. Folder structure
```
apps/mobile/
  app/                      Expo Router routes
    _layout.tsx             providers, fonts, i18n, query client
    (tabs)/_layout.tsx  index.tsx  cart.tsx  account.tsx
    product/[id].tsx   checkout/index.tsx   order/[id].tsx
  src/
    api/        sdk.ts  products.ts  cart.ts  checkout.ts  wishlist.ts  errors.ts
    features/   catalog/  cart/  checkout/  settings/  wishlist/
    ui/         Button  TextField  Chip  ProductCard  QuantityStepper  Banner  PriceText  EmptyState  Skeleton
    i18n/       index.ts  ar.json  en.json
    theme/      tokens.ts  useTheme.ts
    lib/        money.ts  network.ts  storage.ts  rtl.ts
  __tests__/ or *.test.tsx beside source
apps/backend/
  src/modules/wishlist/     models/ service.ts index.ts migrations/
  src/api/store/wishlist/   route.ts  [item_id]/route.ts  middlewares.ts
  src/links/                (only if using module links)
  src/scripts/seed.ts
  integration-tests/http/
```

## 4. Checkout sequence (online only)
```mermaid
sequenceDiagram
  participant A as App
  participant M as Medusa
  A->>A: read local cart (source of truth until now)
  A->>M: POST /store/carts (region_id, items, email)
  A->>M: POST /store/carts/:id (shipping_address)
  A->>M: GET /store/shipping-options?cart_id
  A->>M: POST /store/carts/:id/shipping-methods
  A->>M: POST /store/payment-collections (cart_id)
  A->>M: POST /store/payment-collections/:id/payment-sessions (system default provider)
  A->>M: POST /store/carts/:id/complete
  M-->>A: order
  A->>A: clear local cart, show confirmation
```
Server prices are authoritative. If totals differ from the local estimate, show the server total and a "prices updated" notice before completing.

## 5. Connectivity model
```mermaid
stateDiagram-v2
  [*] --> Online
  Online --> Offline: NetInfo unreachable
  Offline --> Online: reachable again
  Online: queries fetch normally
  Offline: serve persisted cache, banner visible, cart edits allowed, checkout disabled
```
Use `onlineManager` (TanStack Query) wired to NetInfo. "Connected" means the Medusa host is reachable, not just that Wi-Fi is on.

## 6. Error handling
`src/api/errors.ts` maps SDK/HTTP errors to a small union: `Offline | Timeout | NotFound | Validation | Server | Unknown`. UI shows a localized message plus a retry action. Never show raw server text to users. Log (dev only) without PII.

## 7. Configuration
| Variable | Where | Public? |
|---|---|---|
| `EXPO_PUBLIC_MEDUSA_URL` | mobile `.env` | yes (URL only) |
| `EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | mobile `.env` | yes (publishable by design) |
| `DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS` | backend `.env` | **never committed** |

On a physical phone, `EXPO_PUBLIC_MEDUSA_URL` must be the computer's LAN IP (e.g. `http://192.168.x.x:9000`), not `localhost`. Android emulator uses `http://10.0.2.2:9000`. Cleartext HTTP is for local development only.
