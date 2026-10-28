import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

/**
 * "Online" means the radio is up AND the internet is not known to be unreachable.
 * `isInternetReachable` is `null` while unknown — treat unknown as online so we never block the user on a guess.
 */
export function isOnlineFromState(state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

let started = false;

/**
 * Wires NetInfo -> TanStack Query `onlineManager`. Reachability is checked against the Medusa host's /health,
 * so "connected" means our backend answers, not just that Wi-Fi is on (docs/01-ARCHITECTURE.md section 5).
 * Call once at app start. Returns an unsubscribe for tests.
 */
export function startConnectivity(medusaUrl: string): () => void {
  if (started) return () => {};
  started = true;
  NetInfo.configure({
    reachabilityUrl: `${medusaUrl.replace(/\/$/, '')}/health`,
    reachabilityMethod: 'GET',
    reachabilityTest: async (response) => response.status === 200,
    reachabilityLongTimeout: 60 * 1000,
    reachabilityShortTimeout: 5 * 1000,
    reachabilityRequestTimeout: 15 * 1000,
  });
  onlineManager.setEventListener((setOnline) => {
    const unsubscribe = NetInfo.addEventListener((state) => setOnline(isOnlineFromState(state)));
    return unsubscribe;
  });
  return () => {
    started = false;
  };
}

/** Reactive online flag backed by TanStack Query's onlineManager. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (listener) => onlineManager.subscribe(listener),
    () => onlineManager.isOnline(),
    () => true,
  );
}
