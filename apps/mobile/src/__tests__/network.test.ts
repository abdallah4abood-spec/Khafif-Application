import { isOnlineFromState } from '@/lib/network';
import { shouldPersistQuery } from '@/lib/queryClient';

describe('isOnlineFromState', () => {
  it('is online when connected and reachability is true or unknown', () => {
    expect(isOnlineFromState({ isConnected: true, isInternetReachable: true })).toBe(true);
    expect(isOnlineFromState({ isConnected: true, isInternetReachable: null })).toBe(true);
  });
  it('is offline when disconnected or the internet is known unreachable', () => {
    expect(isOnlineFromState({ isConnected: false, isInternetReachable: false })).toBe(false);
    expect(isOnlineFromState({ isConnected: true, isInternetReachable: false })).toBe(false);
    expect(isOnlineFromState({ isConnected: null, isInternetReachable: null })).toBe(false);
  });
});

describe('shouldPersistQuery', () => {
  it('persists only successful catalog queries', () => {
    expect(shouldPersistQuery(['catalog', 'products'], 'success')).toBe(true);
    expect(shouldPersistQuery(['catalog', 'products'], 'error')).toBe(false);
    expect(shouldPersistQuery(['cart'], 'success')).toBe(false);
  });
});
