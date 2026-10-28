import Medusa from '@medusajs/js-sdk';
import * as SecureStore from 'expo-secure-store';

// Expo only inlines `process.env.EXPO_PUBLIC_*` when accessed statically, so read them explicitly.
const baseUrl = process.env.EXPO_PUBLIC_MEDUSA_URL;
const publishableKey = process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

if (!baseUrl || !publishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_MEDUSA_URL or EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY. Copy .env.example to .env (see docs/10-SETUP-WINDOWS.md).',
  );
}

export const MEDUSA_URL: string = baseUrl;

/** Auth token goes to SecureStore, never AsyncStorage (docs/08-SECURITY.md). */
const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

/** The only place that instantiates the Medusa SDK. Screens must not import this directly. */
export const sdk = new Medusa({
  baseUrl,
  publishableKey,
  debug: __DEV__,
  auth: {
    type: 'jwt',
    jwtTokenStorageMethod: 'custom',
    storage: secureStorage,
    jwtTokenStorageKey: 'medusa_auth_token',
  },
});
