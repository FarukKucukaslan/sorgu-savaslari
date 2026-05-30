import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { SubmitSqlAttemptResult } from '@/lib/sql-rpg';

export type ArenaStats = {
  totalDamage: number;
  totalXP: number;
  totalCriticals: number;
  totalSuccesses: number;
  totalAttempts: number;
  lastUpdated: string | null;
};

export const STORAGE_KEY = 'sql_arena_stats_v1';

let memoryStats: ArenaStats | null = null;

const defaultStats: ArenaStats = {
  totalDamage: 0,
  totalXP: 0,
  totalCriticals: 0,
  totalSuccesses: 0,
  totalAttempts: 0,
  lastUpdated: null,
};

export async function loadStats(): Promise<ArenaStats> {
  // Try AsyncStorage first
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ArenaStats;
      memoryStats = { ...defaultStats, ...parsed };
      return memoryStats;
    }
  } catch (e) {
    console.warn('loadStats: AsyncStorage failed, falling back to SecureStore or memory', e);
  }

  // Try SecureStore next (available in Expo Go)
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ArenaStats;
      memoryStats = { ...defaultStats, ...parsed };
      return memoryStats;
    }
  } catch (e) {
    console.warn('loadStats: SecureStore failed, falling back to memory', e);
  }

  // Finally memory fallback
  if (memoryStats) return memoryStats;
  return defaultStats;
}

export async function saveStats(stats: ArenaStats): Promise<void> {
  // Try AsyncStorage
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    memoryStats = stats;
    return;
  } catch (e) {
    console.warn('saveStats: AsyncStorage failed, trying SecureStore', e);
  }

  // Try SecureStore
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(stats));
    memoryStats = stats;
    return;
  } catch (e) {
    console.warn('saveStats: SecureStore failed, using memory fallback', e);
    memoryStats = stats;
  }
}

export async function recordAttempt(result: SubmitSqlAttemptResult) {
  const stats = await loadStats();

  const updated: ArenaStats = {
    totalDamage: stats.totalDamage + (result.damage ?? 0),
    totalXP: stats.totalXP + (result.xpAwarded ?? 0),
    totalCriticals: stats.totalCriticals + (result.critical ? 1 : 0),
    totalSuccesses: stats.totalSuccesses + (result.success ? 1 : 0),
    totalAttempts: stats.totalAttempts + 1,
    lastUpdated: new Date().toISOString(),
  };

  await saveStats(updated);
  return updated;
}
