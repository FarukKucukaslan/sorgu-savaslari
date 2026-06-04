import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getUserProfile, getOrCreateUserProfile } from '@/lib/sql-rpg';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/lib/sql-rpg';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      let userProfile = await getUserProfile(user.id);
      if (!userProfile) {
        userProfile = await getOrCreateUserProfile(user.id, user.email?.split('@')[0] || 'Player');
      }

      setProfile(userProfile);
    } catch (error) {
      console.error('Profile yuklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!profile) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Profil yuklenemedi.</ThemedText>
      </ThemedView>
    );
  }

  const nextLevelXp = (profile.level * 500);
  const currentLevelXp = ((profile.level - 1) * 500);
  const xpInLevel = profile.totalXp - currentLevelXp;
  const xpForNextLevel = nextLevelXp - currentLevelXp;
  const progressPercent = Math.min(100, (xpInLevel / xpForNextLevel) * 100);

  const successRate = profile.totalAttempts > 0 
    ? ((profile.totalSuccesses / profile.totalAttempts) * 100).toFixed(1)
    : '0.0';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.headerCard}>
        <ThemedText type="title" style={styles.username}>
          {profile.username}
        </ThemedText>
        {profile.characterTitle && (
          <ThemedText type="subtitle" style={styles.title}>
            &quot;{profile.characterTitle}&quot;
          </ThemedText>
        )}

        <ThemedView style={styles.levelSection}>
          <ThemedText type="defaultSemiBold" style={styles.levelText}>
            Level {profile.level}
          </ThemedText>
          <View style={[styles.progressBar, { width: '100%' }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%` },
                { backgroundColor: Colors[colorScheme ?? 'light'].tint },
              ]}
            />
          </View>
          <ThemedText style={styles.xpText}>
            {profile.totalXp} / {nextLevelXp} XP
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.statsGrid}>
        <ThemedView style={styles.statCard}>
          <ThemedText type="defaultSemiBold">Toplam Hasar</ThemedText>
          <ThemedText style={styles.statValue}>{profile.totalDamage}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statCard}>
          <ThemedText type="defaultSemiBold">Toplam XP</ThemedText>
          <ThemedText style={styles.statValue}>{profile.totalXp}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statCard}>
          <ThemedText type="defaultSemiBold">Başarı Oranı</ThemedText>
          <ThemedText style={styles.statValue}>{successRate}%</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statCard}>
          <ThemedText type="defaultSemiBold">Kritik Vuruş</ThemedText>
          <ThemedText style={styles.statValue}>{profile.totalCriticalHits}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statCard}>
          <ThemedText type="defaultSemiBold">Şu Anki Kombo</ThemedText>
          <ThemedText style={styles.statValue}>{profile.currentCombo}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statCard}>
          <ThemedText type="defaultSemiBold">En Yüksek Kombo</ThemedText>
          <ThemedText style={styles.statValue}>{profile.bestCombo}</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.detailsCard}>
        <ThemedText type="defaultSemiBold">Detaylı İstatistikler</ThemedText>
        <View style={styles.detailRow}>
          <ThemedText>Toplam Denemeler</ThemedText>
          <ThemedText type="defaultSemiBold">{profile.totalAttempts}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText>Başarılı Denemeler</ThemedText>
          <ThemedText type="defaultSemiBold">{profile.totalSuccesses}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText>Son Aktif</ThemedText>
          <ThemedText type="defaultSemiBold">
            {new Date(profile.lastActive).toLocaleDateString('tr-TR')}
          </ThemedText>
        </View>
      </ThemedView>
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
  headerCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  username: {
    fontSize: 28,
    fontWeight: '700',
  },
  title: {
    fontStyle: 'italic',
  },
  levelSection: {
    gap: 8,
    marginTop: 8,
  },
  levelText: {
    fontSize: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '31%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  detailsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
});
