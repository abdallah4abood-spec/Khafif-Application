# VERSIONS (real values, recorded 2026-10-28 from the installed projects)

| Item | Version | Source |
|---|---|---|
| Node.js | v22.23.4 | `node -v` |
| npm | 10.9.9 | `npm -v` |
| Expo SDK | 58 (`expo` 58.0.x, `~58.0.20` in package.json) | `apps/mobile/package.json` |
| React Native / React | 0.88.0 / 19.3.0 | `apps/mobile/package.json` |
| Expo Router | ~58.0.27 | `apps/mobile/package.json` |
| TanStack Query | 5.105.x | `apps/mobile/package.json` |
| Medusa (`@medusajs/medusa`, js-sdk) | 2.22.1 | `apps/backend/package.json` |
| PostgreSQL | 16.15 (local Ubuntu package used for verification); `postgres:16-alpine` in `infra/docker-compose.yml` was NOT run (no Docker daemon in the build sandbox) | `psql --version` |
| Jest / jest-expo / RNTL | 29.7 / ~58.0.12 / 14.1 | `apps/mobile/package.json` |

## Extra dependencies (one-line justification each)
- `@tanstack/react-query`, `-persist-client`, `query-async-storage-persister`: server state + persisted catalog cache (ADR in 02).
- `zustand`: persisted client state (settings now, cart in M4).
- `i18next`, `react-i18next`, `expo-localization`: ar/en strings and device-language default.
- `@react-native-community/netinfo`: connectivity -> `onlineManager`.
- `@react-native-async-storage/async-storage`: persisted stores/cache (non-secret).
- `expo-secure-store`: Medusa auth token (docs/08).
- `@medusajs/js-sdk`: the only Medusa client (docs/04).
- `@expo-google-fonts/ibm-plex-sans-arabic`: brand font (docs/05).
- `@expo/vector-icons`: Feather tab icons.
- dev: `jest`, `jest-expo`, `@testing-library/react-native` (+`test-renderer`, required by RNTL 14), `eslint`, `eslint-config-expo`, `prettier`, `@types/jest`.
- backend: template pins `@medusajs/ui` 4.2.6 but `@medusajs/draft-order` 2.22.1 needs 4.2.8 (peer) -> bumped to 4.2.8 so `npm install` resolves without `--force`.

## How versions were chosen
`npx expo install` could not reach `api.expo.dev` from the build sandbox (proxy 403). Expo-managed packages were therefore pinned from `node_modules/expo/bundledNativeModules.json` (the SDK's own compatibility list) with plain `npm install`. On your machine you can run `npx expo install --check` to confirm.
