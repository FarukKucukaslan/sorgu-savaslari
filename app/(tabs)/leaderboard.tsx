import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getLeaderboard } from '@/lib/sql-rpg';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import type { LeaderboardEntry } from '@/lib/sql-rpg';

export default function LeaderboardScreen() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(100);
      setEntries(data);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Leaderboard yuklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  useFocusEffect(
    useCallback(() => {
      void loadLeaderboard();
    }, [loadLeaderboard])
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedText type="title">Liderlik Tablosu</ThemedText>
      <ThemedText type="subtitle">En iyi SQL savaşçıları</ThemedText>

      {entries.length === 0 ? (
        <ThemedView style={styles.emptyCard}>
          <ThemedText>Henüz kimse oynamadı.</ThemedText>
        </ThemedView>
      ) : (
        entries.map((entry, index) => {
          const isTopThree = index < 3;
          const medals = ['🥇', '🥈', '🥉'];
          const isCurrentUser = entry.userId === currentUserId;

          return (
            <ThemedView
              key={entry.userId}
              style={[
                styles.entryCard,
                isTopThree && styles.topThreeCard,
                isCurrentUser && styles.currentUserCard,
              ]}>
              <View style={styles.rankSection}>
                <ThemedText style={styles.medal}>
                  {isTopThree ? medals[index] : `#${entry.rank}`}
                </ThemedText>
              </View>

              <View style={styles.userSection}>
                <ThemedText type="defaultSemiBold">
                  {entry.username}
                </ThemedText>
                <ThemedText style={styles.stats}>
                  {entry.attempts} deneme · %{entry.successRate.toFixed(1)} başarı
                </ThemedText>
              </View>

              <View style={styles.xpSection}>
                <ThemedText type="defaultSemiBold" style={styles.xpValue}>
                  {entry.totalXp}
                </ThemedText>
                <ThemedText style={styles.xpLabel}>XP</ThemedText>
              </View>
            </ThemedView>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 32,
    gap: 12,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  topThreeCard: {
    borderColor: '#FCD34D',
    backgroundColor: 'rgba(252, 211, 77, 0.05)',
  },
  currentUserCard: {
    borderColor: '#34D399',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  rankSection: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
  },
  medal: {
    fontSize: 28,
  },
  userSection: {
    flex: 1,
    gap: 4,
  },
  stats: {
    fontSize: 12,
    opacity: 0.7,
  },
  xpSection: {
    alignItems: 'flex-end',
  },
  xpValue: {
    fontSize: 18,
  },
  xpLabel: {
    fontSize: 10,
    opacity: 0.7,
  },
});
