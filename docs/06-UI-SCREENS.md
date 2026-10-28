# 06 — UI Screens

Mockups: Khafif design canvas (Brand, Home AR, Product EN, Cart AR, Checkout AR). Sample product names/prices are seed data.
Every screen: loading (skeleton), empty, error (retry), offline (banner), both directions, ≥44 px targets.

| Route | Screen | Purpose and content | Data | Acceptance criteria |
|---|---|---|---|---|
| `app/(tabs)/index.tsx` | Home / catalog | Header (logo, language toggle), search field, info card, category chips, 2-column product grid, infinite scroll | `useInfiniteQuery` products (limit 12), categories | Typing in search debounces 400 ms; chip filters; scroll loads next page; cached list shows offline with "last updated" note |
| `app/product/[id].tsx` | Product detail | Hero image, title, price, description, option chips, quantity stepper, sticky "Add to cart" | `GET product` + calculated price | Variant required before add; button disabled when out of stock; adding updates cart badge; works offline if product was cached |
| `app/(tabs)/cart.tsx` | Cart | Item rows (thumbnail, title, qty, line estimate), offline banner, estimated total, "Continue to checkout" | local cart store | Edits persist across restart; empty state links to Home; checkout button disabled offline with explanation |
| `app/checkout/index.tsx` | Checkout (3 steps: address, shipping, review) | Email, name, address, phone fields; shipping options; test-payment notice; confirm | Medusa checkout sequence | Inline validation (zod, localized); server totals shown; double-tap safe (button locked while submitting); errors recoverable |
| `app/order/[id].tsx` | Confirmation | Order number, summary, "Continue shopping" | order response | Clears local cart only after successful completion |
| `app/(tabs)/account.tsx` | Account / settings | Language (ar/en), connection status, about; (stretch) login, wishlist, orders | settings store | Language switch applies direction and persists; reload handled |

## Layout notes
- Bottom tabs: Home, Cart (badge with item count), Account. Tab labels localized.
- Home grid: 2 columns, 12 px gap, 20 px side padding; card image height 112 (fixed to avoid layout shift).
- Product hero ratio ~ 1.3:1, back button 44×44 with mirrored arrow.
- Sticky bottom bars use safe-area insets.

## Copy (examples, put in `ar.json`/`en.json`)
`offline.banner`: "أنت غير متصل. سلتك محفوظة وستُزامن عند عودة الاتصال." / "You're offline. Your cart is saved and will sync when you're back online."
`checkout.testMode`: "وضع تجريبي: لا تُجرى أي عملية دفع حقيقية." / "Test mode: no real payment is taken."
