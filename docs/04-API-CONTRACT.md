# 04 — API Contract

**Verify every route and payload against https://docs.medusajs.com/api/store before coding.** Prefer `sdk.store.*` methods from `@medusajs/js-sdk` over raw `fetch`. Every Store request needs the publishable API key (the SDK sends `x-publishable-api-key` when `publishableKey` is set).

## SDK setup (`src/api/sdk.ts`)
```ts
import Medusa from "@medusajs/js-sdk";
import * as SecureStore from "expo-secure-store";

// Adapter: the SDK's custom storage expects getItem / setItem / removeItem.
const secureStorage = {
  getItem: (k: string) => SecureStore.getItemAsync(k),
  setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
  removeItem: (k: string) => SecureStore.deleteItemAsync(k),
};

export const sdk = new Medusa({
  baseUrl: process.env.EXPO_PUBLIC_MEDUSA_URL!,
  publishableKey: process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
  debug: __DEV__,
  auth: { type: "jwt", jwtTokenStorageMethod: "custom", storage: secureStorage },
});
```
Custom JWT storage is supported by the JS SDK in recent Medusa v2 releases (documented as available after v2.5.1). Confirm in the docs; Medusa also publishes an official React Native + Expo tutorial — read it before Milestone 2: https://docs.medusajs.com/resources/storefront-development/guides/react-native-expo

## Endpoints used (Store API)
| Purpose | Route (verify) | Notes |
|---|---|---|
| Regions | `GET /store/regions` | Pick region once; store `regionId` |
| Categories | `GET /store/product-categories` | Small page size |
| Product list | `GET /store/products` | `limit`, `offset`, `q`, `category_id`, `region_id`, `fields` (request only what the list needs: id, title, thumbnail, calculated price) |
| Product detail | `GET /store/products/:id` | Include variants, options, images, calculated price |
| Create cart | `POST /store/carts` | `region_id`, optional `items`, `email` |
| Update cart | `POST /store/carts/:id` | email, shipping address |
| Add line item | `POST /store/carts/:id/line-items` | `variant_id`, `quantity` |
| Shipping options | `GET /store/shipping-options?cart_id=` | |
| Set shipping | `POST /store/carts/:id/shipping-methods` | `option_id` |
| Payment collection | `POST /store/payment-collections` | `cart_id` |
| Payment session | `POST /store/payment-collections/:id/payment-sessions` | `provider_id` of the default/system provider (test only) |
| Complete | `POST /store/carts/:id/complete` | Returns order or error; handle both |
| Auth | `POST /auth/customer/emailpass` (+ `/register`), then `POST /store/customers` | Only for wishlist/order history |
| Orders | `GET /store/orders` | Authenticated customer |

## Custom routes (backend, wishlist milestone)
| Method | Route | Body / Query | Result |
|---|---|---|---|
| GET | `/store/wishlist` | — | `{ wishlist: { id, items: [{ id, product_id }] } }` (create lazily) |
| POST | `/store/wishlist/items` | `{ product_id }` (zod-validated) | 200/201 with updated wishlist; idempotent |
| DELETE | `/store/wishlist/items/:id` | — | 200 `{ id, deleted: true }` |
Auth: customer bearer token required (`authenticate("customer", ["session", "bearer"])` in middlewares — confirm syntax in docs). 401 when missing, 404 for another customer's item (do not leak existence).

## Client error contract
Map to `AppError = { kind: "offline" | "timeout" | "not_found" | "validation" | "server" | "unknown"; message?: string }`. Retries: queries retry 2× with exponential backoff (not for 4xx); mutations do not auto-retry.
