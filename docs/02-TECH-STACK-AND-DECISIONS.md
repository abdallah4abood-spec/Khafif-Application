# 02 — Tech Stack and Decisions

Versions are **not pinned here on purpose**. Scaffold with the latest official tools, then record the installed versions in `docs/VERSIONS.md`.

| Area | Choice | Why | Rejected | Best practice to follow |
|---|---|---|---|---|
| Mobile framework | Expo (managed) + React Native + TypeScript strict | Fastest path, Expo Go on a phone, no Android Studio needed to start | Bare RN CLI (more setup) | Use `npx expo install` for SDK-matched versions; run `npx expo-doctor` |
| Routing | Expo Router (file-based) | Official default, deep links for free, typed routes | React Navigation manual setup | One route per file; typed routes on; keep screens thin |
| Server state | TanStack Query v5 + persisted cache | Caching, retries, pagination, offline-first behavior | Redux Toolkit Query, raw fetch | Stable query keys per feature; `staleTime` per data type; persist only catalog queries |
| Client state | Zustand + `persist` (AsyncStorage) | Tiny, simple, good for cart/settings | Redux (boilerplate) | Selector subscriptions; version the persisted schema; migrations |
| Storage | AsyncStorage (cart/cache), SecureStore (auth token) | Both work in Expo Go | `react-native-mmkv` (needs dev build) | Never store secrets in AsyncStorage |
| Backend | Medusa v2 | Target stack of the role; modular, REST Store API | Custom Express API | Customize through modules/workflows/API routes, not by editing core |
| Database | PostgreSQL (Docker) | Medusa's DB | SQLite | Use migrations (`npx medusa db:migrate`), never hand-edit tables |
| API client | `@medusajs/js-sdk` | Typed, handles publishable key and auth | Hand-written fetch | Single `sdk` instance in `src/api/sdk.ts` |
| Forms | react-hook-form + zod | Validation with types, few re-renders | Formik | One schema per form, localized messages |
| i18n | i18next + react-i18next + expo-localization | Standard, plural rules incl. Arabic | Home-grown | Keys not sentences; test both locales |
| RTL | `I18nManager` + logical styles | Native mirroring | Per-component hacks | Runtime RTL switch needs an app reload; handle it explicitly |
| Lists | FlashList (or FlatList if issues) | Fast, low memory | ScrollView + map | Stable `keyExtractor`, memoized rows, `getItemType` |
| Images | `expo-image` | Disk/memory cache, placeholders, lazy | `Image` from RN | `cachePolicy="memory-disk"`, fixed dimensions, small seeded images |
| Network | `@react-native-community/netinfo` | Works in Expo Go | Polling | Verify reachability of the Medusa host, not only the radio |
| Fonts | IBM Plex Sans Arabic (`@expo-google-fonts/ibm-plex-sans-arabic`) | One family for Arabic + Latin | System font only | Hold splash until fonts load; load only weights used |
| Icons | `@expo/vector-icons` (Feather) | Ships with Expo | Custom SVG set | Flip directional icons in RTL |
| Styling | `StyleSheet` + design tokens | RTL-safe, zero config risk | NativeWind (more config) | All colors/spacing from `tokens.ts` |
| Tests (app) | Jest + `jest-expo` + React Native Testing Library | Official presets | Detox first (heavy) | Test behavior not implementation; mock SDK at `src/api` |
| Tests (backend) | Medusa integration test runner | Official, real DB | Mocks only | One test per custom route and module method |
| Lint/format | `eslint-config-expo`, Prettier | Defaults | — | Run in CI |
| CI | GitHub Actions | Free for public repos | — | lint + typecheck + test on push |

## Decision records (short)
- **ADR-1 Local-first cart.** Cart lives on device and syncs to Medusa at checkout. Why: offline requirement, fewer failed network calls on weak data. Trade-off: price drift; mitigated by server-authoritative totals at checkout.
- **ADR-2 No offline order queue.** Payments/orders need confirmation; queuing risks duplicates. Checkout is disabled offline with a clear message.
- **ADR-3 Two independent npm projects.** Avoids Metro + workspace resolution issues for a beginner. Trade-off: two installs.
- **ADR-4 Expo Go compatible only.** Keeps setup minimal. If a dev build becomes necessary, document why.
- **ADR-5 Test payments only.** Medusa's default provider; no gateway keys. A real gateway is future work.
- **ADR-6 Custom module for wishlist.** Demonstrates Medusa extensibility (module, service, API route, middleware validation) without touching core.
