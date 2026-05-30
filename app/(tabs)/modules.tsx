import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getModules, getUserModuleProgress, getUserProfile } from '@/lib/sql-rpg';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import type { Module, UserModuleProgress, UserProfile } from '@/lib/sql-rpg';

type ModuleWithProgress = Module & {
  progress: UserModuleProgress | null;
  isUnlocked: boolean;
};

export default function ModulesScreen() {
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let user = null;
      let retries = 0;
      const maxRetries = 10;

      // Wait for user to be authenticated (with timeout)
      while (!user && retries < maxRetries) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        user = currentUser;
        
        if (!user) {
          console.log('Waiting for auth... attempt', retries + 1);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 200)); // Wait 200ms
        }
      }

      if (!user) {
        console.warn('User not authenticated after retries');
        setLoading(false);
        return;
      }

      console.log('User authenticated:', user.id);

      // Load modules first - don't wait for profile
      const allModules = await getModules();
      console.log('Modules loaded:', allModules.length);
      
      // Try to load profile but don't fail if it doesn't exist
      try {
        const userProfile = await getUserProfile(user.id);
        if (userProfile) {
          setProfile(userProfile);
          console.log('Profile loaded:', userProfile);
        }
      } catch (profileError) {
        console.warn('Profile load failed:', profileError);
      }

      // Try to load progress data
      let progressData: any[] = [];
      try {
        progressData = await getUserModuleProgress(user.id);
        console.log('Module progress loaded:', progressData.length);
      } catch (progressError) {
        console.warn('Progress load failed:', progressError);
      }

      const progressMap = new Map(progressData.map((p) => [p.moduleId, p]));

      const withProgress: ModuleWithProgress[] = allModules.map((mod) => {
        const progress = progressMap.get(mod.id);
        const isUnlocked = !progress ? mod.requiredLevel <= 1 : progress.unlocked;

        return {
          ...mod,
          progress,
          isUnlocked,
        };
      });

      console.log('Modules with progress:', withProgress.length);
      setModules(withProgress);
    } catch (error) {
      console.error('Critical error loading modules:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  const completedModules = modules.filter((m) => m.progress?.completed).length;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedText type="title">Öğrenme Yolculuğu</ThemedText>
      <ThemedText type="subtitle">SQL konseptlerini sırasıyla öğrenin</ThemedText>

      <ThemedView style={styles.progressCard}>
        <ThemedText type="defaultSemiBold">
          {completedModules} / {modules.length} Modül Tamamlandı
        </ThemedText>
        <ThemedView style={styles.progressBar}>
          <ThemedView
            style={[
              styles.progressFill,
              {
                width: `${(completedModules / modules.length) * 100}%`,
                backgroundColor: Colors[colorScheme ?? 'light'].tint,
              },
            ]}
          />
        </ThemedView>
      </ThemedView>

      {modules.map((mod) => {
        const isLocked = !mod.isUnlocked;
        const progress = mod.progress?.progressPercent ?? 0;
        const isCompleted = mod.progress?.completed ?? false;

        return (
          <Pressable
            key={mod.id}
            disabled={isLocked}
            style={({ pressed }) => [
              styles.moduleCard,
              isLocked && styles.lockedModule,
              pressed && !isLocked && styles.modulePressed,
            ]}>
            <ThemedView style={styles.moduleHeader}>
              <ThemedView>
                <ThemedText
                  type="defaultSemiBold"
                  style={isLocked && styles.lockedText}>
                  {mod.name}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.concept,
                    isLocked && styles.lockedText,
                  ]}>
                  SQL Konsepti: {mod.sqlConcept}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.statusBadge}>
                <ThemedText style={styles.badgeText}>
                  {isLocked
                    ? `Seviye ${mod.requiredLevel} gerekli`
                    : isCompleted
                    ? '✓'
                    : `${progress}%`}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {mod.description && (
              <ThemedText style={[styles.description, isLocked && styles.lockedText]}>
                {mod.description}
              </ThemedText>
            )}

            {!isLocked && (
              <ThemedView style={styles.progressBar}>
                <ThemedView
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: isCompleted
                        ? '#10B981'
                        : Colors[colorScheme ?? 'light'].tint,
                    },
                  ]}
                />
              </ThemedView>
            )}
          </Pressable>
        );
      })}
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
  progressCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  moduleCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  modulePressed: {
    opacity: 0.7,
  },
  lockedModule: {
    opacity: 0.5,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  concept: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    opacity: 0.8,
  },
  lockedText: {
    opacity: 0.5,
  },
});
