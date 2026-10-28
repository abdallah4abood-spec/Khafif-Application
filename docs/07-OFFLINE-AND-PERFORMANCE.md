# 07 — Offline Behavior and Performance (low bandwidth)

## Offline rules
| Situation | Behavior |
|---|---|
| Offline, cached catalog exists | Show cached lists/details, banner "offline", "last updated" label |
| Offline, no cache | EmptyState with retry; never a blank screen |
| Cart edits offline | Allowed; stored locally |
| Checkout offline | Disabled with explanation; no queued orders (ADR-2) |
| Back online | `onlineManager` resumes queries; stale queries refetch; banner dismisses |

Implementation notes: wire NetInfo to TanStack Query `onlineManager`; set `networkMode: "offlineFirst"` for catalog queries; persist only keys starting with `["catalog"]` using the AsyncStorage persister; `gcTime` 24 h, `staleTime`: lists 5 min, detail 10 min; `buster` = app version so schema changes invalidate old caches.

## Payload and rendering budget (targets, to be measured — do not claim before measuring)
- List request: `limit=12`, `fields` restricted to what the card renders.
- Images: seeded at ≤ ~100 KB, fixed display size, `expo-image` with `cachePolicy="memory-disk"` and placeholder; lazy by list virtualization.
- Search: debounce 400 ms; cancel in-flight request on new input (`signal`/query key change).
- Lists: FlashList, memoized rows, stable keys, no inline object styles in rows.
- Startup: hold splash only for fonts + locale; no blocking network call before first paint.
- Avoid re-renders: select the minimal slice from Zustand; no context for frequently changing values.

## Measuring (write results to `docs/PERFORMANCE.md`)
Record device model/emulator, OS, build mode (dev vs release), network condition (throttled or real), method (e.g. React DevTools profiler, network inspector, manual stopwatch over 5 runs), and the numbers. If something is not measured, write "not measured". Never copy numbers from another project.
Suggested checks: payload size of the first list request; time from app open to first products (cold/warm cache, 5 runs each); behavior in airplane mode; list scroll smoothness on a mid-range Android device if available.

## Known limits (state these in the README)
No server-side image resizing/CDN in the MVP; cache invalidation is time-based; cart price estimates can drift until checkout.
