import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getAchievements, getUserAchievements } from '@/lib/sql-rpg';
import { supabase } from '@/lib/supabase';
import type { Achievement, UserAchievement } from '@/lib/sql-rpg';

type AchievementWithStatus = Achievement & { unlocked: boolean };

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalXp, setTotalXp] = useState(0);

  const loadAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const allAchievements = await getAchievements();
      const userAchievements = await getUserAchievements(user.id);
      const unlockedIds = new Set(userAchievements.map((a) => a.achievementId));
      
      const totalXpEarned = userAchievements.reduce((sum, a) => {
        const ach = allAchievements.find((item) => item.id === a.achievementId);
        return sum + (ach?.rewardXp || 0);
      }, 0);

      const withStatus = allAchievements.map((ach) => ({
        ...ach,
        unlocked: unlockedIds.has(ach.id),
      }));

      setAchievements(withStatus);
      setTotalXp(totalXpEarned);
    } catch (error) {
      console.error('Achievements yuklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAchievements();
  }, [loadAchievements]);

  useFocusEffect(
    useCallback(() => {
      void loadAchievements();
    }, [loadAchievements])
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedText type="title">Başarılar</ThemedText>
      <ThemedText type="subtitle">Zorluk çıkartıp ödülleri kazanın</ThemedText>

      <ThemedView style={styles.summaryCard}>
        <ThemedText type="defaultSemiBold">
          {unlockedCount} / {achievements.length} Başarı Açıldı
        </ThemedText>
        <ThemedText>Kazanılan XP: {totalXp}</ThemedText>
      </ThemedView>

      {achievements.map((achievement) => (
        <ThemedView
          key={achievement.id}
          style={[
            styles.achievementCard,
            !achievement.unlocked && styles.lockedCard,
          ]}>
          <ThemedView style={styles.iconAndTitle}>
            <ThemedText style={styles.icon}>
              {achievement.unlocked ? achievement.icon : '🔒'}
            </ThemedText>
            <ThemedView style={styles.titleSection}>
              <ThemedText
                type="defaultSemiBold"
                style={!achievement.unlocked && styles.lockedText}>
                {achievement.title}
              </ThemedText>
              {achievement.description && (
                <ThemedText style={styles.description}>
                  {achievement.description}
                </ThemedText>
              )}
            </ThemedView>
          </ThemedView>
          <ThemedText
            style={[styles.reward, !achievement.unlocked && styles.lockedText]}>
            +{achievement.rewardXp} XP
          </ThemedText>
        </ThemedView>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 32,
    gap: 16,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  achievementCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  lockedCard: {
    opacity: 0.6,
  },
  iconAndTitle: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 32,
  },
  titleSection: {
    flex: 1,
    gap: 4,
  },
  description: {
    fontSize: 12,
    opacity: 0.7,
  },
  lockedText: {
    opacity: 0.5,
  },
  reward: {
    fontWeight: '700',
    fontSize: 12,
  },
});
