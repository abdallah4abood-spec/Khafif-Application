# AGENTS.md — Khafif (خفيف)

You are the coding agent for **Khafif**, a low-bandwidth, Arabic-first mobile storefront (Expo / React Native) on a **Medusa v2** backend. The owner is a developer who is new to React Native and Expo: explain important decisions briefly, and teach while building. Read this file fully before every session.

## Read first (in order)
1. `docs/00-PROJECT-BRIEF.md` — scope and success criteria
2. `docs/01-ARCHITECTURE.md`, `docs/02-TECH-STACK-AND-DECISIONS.md`
3. `docs/03-DATABASE-SCHEMA.md`, `docs/04-API-CONTRACT.md`
4. `docs/05-DESIGN-SYSTEM.md`, `docs/06-UI-SCREENS.md`
5. `docs/07-OFFLINE-AND-PERFORMANCE.md`, `docs/08-SECURITY.md`, `docs/09-TESTING-STRATEGY.md`
6. `docs/11-ROADMAP-AND-AGENT-PROMPTS.md` — work **one milestone at a time**

## Non-negotiable rules
1. **Never invent versions, flags, or API shapes from memory.** Expo and Medusa change often. Before using any API, check the official docs (Expo: https://docs.expo.dev — append `.md` to a page URL for Markdown; Medusa: https://docs.medusajs.com and the Store API reference https://docs.medusajs.com/api/store). Create projects with `npx create-expo-app@latest` and `npx create-medusa-app@latest`, then record the versions actually installed in `docs/VERSIONS.md`.
2. **Never claim something works unless you ran it.** After each task, report the exact commands you ran and their real output (pass/fail). If you could not run something (no emulator, no Docker), say so explicitly.
3. **Smallest change that satisfies the milestone.** No extra features, no speculative abstractions, no new dependencies without a one-line justification in `docs/VERSIONS.md`.
4. **Stay inside Expo Go compatibility** (no custom native modules, no `react-native-mmkv`) unless the owner approves a development build. Prefer `npx expo install <pkg>` so versions match the SDK.
5. **No secrets in the repo or the app bundle.** Only `EXPO_PUBLIC_*` values (the Medusa URL and the *publishable* key) may reach the app. Commit `.env.example`, never `.env`.
6. **TypeScript strict. No `any`, no `@ts-ignore`** without a comment explaining why.
7. **RTL-safe by default.** Use logical style props (`marginStart`, `paddingEnd`, `start`, `end`, `flexDirection: 'row'` which mirrors automatically). Never hard-code `left`/`right`/`textAlign: 'left'`. Flip direction-implying icons (chevrons, back arrows).
8. **Every user-visible string goes through i18n** (`ar` and `en`). No literal UI text in components.
9. **Every feature ships with tests** (see `docs/09-TESTING-STRATEGY.md`) and handles four states: loading, empty, error, offline.
10. **Ask before** deleting files, changing the architecture, adding paid services, or when a requirement is ambiguous. Do not guess.
11. **Do not fabricate metrics.** Performance numbers go into `docs/PERFORMANCE.md` only after being measured, with the method and device noted.
12. Money values come from Medusa. Never compute final totals on the client; the client may show estimates labelled as such.

## Repository layout (target)
```
khafif/
  AGENTS.md  README.md
  assets/            logo + brand assets
  docs/              these documents
  infra/docker-compose.yml     PostgreSQL (and optional Redis)
  apps/backend/      Medusa v2 (custom module: wishlist)
  apps/mobile/       Expo app (Expo Router; routes in src/app, see docs/13 ADR-9)
```
See `docs/13-DECISIONS-ADDENDUM.md` for deviations from the original pack (read it after the list above).
`apps/backend` and `apps/mobile` are **independent npm projects** (no monorepo tooling) to avoid Metro and workspace pitfalls.

## Commands (verify they exist after scaffolding)
- Infra: `docker compose -f infra/docker-compose.yml up -d`
- Backend (in `apps/backend`): `npm run dev`, `npm run seed` (idempotent; prints the publishable key), `npm run build`, `npm run test:integration:http`
- Mobile (in `apps/mobile`): `npx expo start`, `npm test`, `npm run lint`, `npx tsc --noEmit`, `npx expo-doctor`
- `npx expo install` needs api.expo.dev; if blocked, pin from `node_modules/expo/bundledNativeModules.json` (see docs/VERSIONS.md)

## Code style
- Prettier + `eslint-config-expo`. Conventional commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), small commits.
- Feature-first folders in the mobile app (`src/features/<name>`), shared UI in `src/ui`, tokens in `src/theme/tokens.ts`.
- Server state: TanStack Query. Client state: Zustand (persisted). No Redux.
- Functional components, hooks, no class components. Memoize list rows; keep render functions pure.

## Definition of done (per milestone)
Code compiles (`tsc --noEmit`), lint clean, tests pass, feature works on a real device or emulator (or the gap is stated), docs updated, a short "what I verified / what I did not" note written.

## Reporting format (end of every task)
```
Done: <what changed>
Ran: <commands> -> <real results>
Not verified: <anything not run>
Decisions: <non-obvious choices + why>
Next: <the next smallest step>
```
