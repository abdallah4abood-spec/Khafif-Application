process.env.EXPO_PUBLIC_MEDUSA_URL = 'http://localhost:9000';
process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY = 'pk_test';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
