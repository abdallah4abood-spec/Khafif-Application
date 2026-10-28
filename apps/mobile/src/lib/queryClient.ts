import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import { shouldRetry } from '@/api/errors';

const DAY_MS = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: shouldRetry, gcTime: DAY_MS, staleTime: 5 * 60 * 1000 },
    mutations: { retry: false },
  },
});

export const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'khafif.rq.v1' });

/** Only catalog queries (keys starting with "catalog") are persisted; the cache is invalidated on app-version change. */
export function shouldPersistQuery(queryKey: readonly unknown[], status: string): boolean {
  return queryKey[0] === 'catalog' && status === 'success';
}

export const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  persister,
  maxAge: DAY_MS,
  buster: Constants.expoConfig?.version ?? '0',
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => shouldPersistQuery(query.queryKey, query.state.status),
  },
};
