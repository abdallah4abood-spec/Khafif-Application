import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** Zustand `persist` storage backed by AsyncStorage. Never put secrets here (use SecureStore). */
export const asyncJsonStorage = createJSONStorage(() => AsyncStorage)!;
