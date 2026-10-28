# 10 — Run Khafif on Windows

The repository already contains the Medusa backend, Expo app and lockfiles. Do not scaffold over them. The backend and mobile directories are independent npm projects.

## Prerequisites
- Node.js and npm compatible with the pinned projects (verify `node -v` and `npm -v`; versions seen in the 2026-10-28 workspace were Node v24.12.0 and npm 11.6.2).
- Docker Desktop running for PostgreSQL, unless you have an equivalent PostgreSQL 16 service.
- Expo Go from Google Play for a physical Android phone. An Android emulator/Android Studio is optional.

## Configure local environment
Copy `apps/backend/.env.example` to `apps/backend/.env` and `apps/mobile/.env.example` to `apps/mobile/.env`. Keep both local files untracked. Set strong random `JWT_SECRET` and `COOKIE_SECRET` values in the backend environment. Set `BACKEND_URL` before seeding: use `http://<PC-LAN-IPv4>:9000` if seeded images must load from a phone, otherwise `http://localhost:9000`. Set the mobile `EXPO_PUBLIC_MEDUSA_URL` to the same reachable backend origin (`http://10.0.2.2:9000` for Android emulator), and populate its publishable key with the one printed by the seed command. The URL and publishable key are public development configuration, not secrets; never put private keys in `EXPO_PUBLIC_*`.

Find the PC IPv4 with `ipconfig` and use the active Wi-Fi/Ethernet adapter address, not localhost, on a phone. Keep the phone and PC on the same network. Allow only the required development ports through Windows Firewall if needed.

## Install and start PostgreSQL
In PowerShell from the repository root:

```powershell
docker compose -f infra/docker-compose.yml up -d
```

This starts the configured local PostgreSQL 16 container. The compose password is for local development only; do not reuse it outside this isolated setup. Confirm Docker Desktop is running with `docker info` if compose reports that it cannot connect.

## Install and start Medusa
```powershell
cd apps/backend
npm ci
npm run dev
```
In a second PowerShell window from `apps/backend`, seed the database after configuring `BACKEND_URL` and the backend `.env`:

```powershell
npm run seed
```
Copy the printed publishable API key to `apps/mobile/.env`. The seed script creates the ILS region, sales channel, sample catalog, test provider and shipping options. Keep the Medusa server running on port 9000.

## Install and start Expo
In another PowerShell window:

```powershell
cd apps/mobile
npm ci
npx expo start
```
Open `http://localhost:8081` on the PC for the configured web target, or scan the Metro QR code with Expo Go on the phone. If a phone cannot connect, verify the LAN URL in mobile `.env`, same Wi-Fi, and required firewall access. If Expo Go reports that its native runtime is incompatible, install the matching SDK-58 Expo Go or use a project-compatible development build; no physical device was available to validate this during the current handover.

## Mobile checks
From `apps/mobile`:

```powershell
npm run typecheck
npm run lint
npm test -- --runInBand --forceExit
```

## Common issues
- Phone cannot reach Medusa: use the PC LAN IPv4 in mobile `.env`, not localhost; ensure both devices share a network.
- Android emulator cannot reach the host via localhost: use `http://10.0.2.2:9000`.
- Seeded image links are unreachable on phone: set backend `BACKEND_URL` to the LAN URL before `npm run seed`; re-seed only according to the project's safe seed procedure.
- Metro cache issue: `npx expo start -c`.
- Native Windows Medusa issue: the app is configured for Node; if Medusa itself fails on Windows, inspect its specific first error before considering WSL2. No backend runtime test was possible in this workspace because backend dependencies and `.env` were absent.
