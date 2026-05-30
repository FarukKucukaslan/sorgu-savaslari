import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getUserSkills, getUserProfile } from '@/lib/sql-rpg';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import type { UserSkill, UserProfile } from '@/lib/sql-rpg';

type SkillNode = {
  key: string;
  title: string;
  description: string;
  requiredLevel: number;
  icon: string;
  requiresSkill?: string;
};

const SKILL_TREE: SkillNode[] = [
  {
    key: 'select-basics',
    title: 'SELECT Temelleri',
    description: 'Temel SELECT sorgusunu öğrenin',
    requiredLevel: 1,
    icon: '📖',
  },
  {
    key: 'where-clause',
    title: 'WHERE Cümlesi',
    description: 'Veriyi şartlı olarak filtreleyebileceksiniz',
    requiredLevel: 1,
    icon: '🔍',
    requiresSkill: 'select-basics',
  },
  {
    key: 'order-limit',
    title: 'ORDER BY & LIMIT',
    description: 'Sonuçları sıralayın ve sayı sınırlayın',
    requiredLevel: 2,
    icon: '📊',
    requiresSkill: 'select-basics',
  },
  {
    key: 'aggregate-functions',
    title: 'Aggregate Fonksiyonları',
    description: 'COUNT, SUM, AVG, MAX, MIN kullanın',
    requiredLevel: 3,
    icon: '➕',
    requiresSkill: 'select-basics',
  },
  {
    key: 'group-by',
    title: 'GROUP BY',
    description: 'Verileri gruplayıp istatistik alın',
    requiredLevel: 3,
    icon: '👥',
    requiresSkill: 'aggregate-functions',
  },
  {
    key: 'joins',
    title: 'JOIN İşlemleri',
    description: 'Birden fazla tabloyu birleştirin',
    requiredLevel: 4,
    icon: '🔗',
    requiresSkill: 'where-clause',
  },
  {
    key: 'subqueries',
    title: 'Alt Sorgular',
    description: 'Sorgu içinde sorgu yazın',
    requiredLevel: 5,
    icon: '🎯',
    requiresSkill: 'joins',
  },
  {
    key: 'advanced-queries',
    title: 'İleri Sorgular',
    description: 'Karmaşık veri analizi yapın',
    requiredLevel: 5,
    icon: '⚡',
    requiresSkill: 'subqueries',
  },
];

export default function SkillsScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userSkills, setUserSkills] = useState<Map<string, UserSkill>>(new Map());
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userProfile = await getUserProfile(user.id);
      setProfile(userProfile);

      const skills = await getUserSkills(user.id);
      const skillMap = new Map(skills.map((s) => [s.skillKey, s]));
      setUserSkills(skillMap);
    } catch (error) {
      console.error('Skills yuklenemedi:', error);
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

  const unlockedCount = userSkills.size;

  const isSkillUnlocked = (skill: SkillNode): boolean => {
    const userLevel = profile?.level ?? 1;
    
    if (userLevel < skill.requiredLevel) return false;
    if (!skill.requiresSkill) return true;
    
    return userSkills.has(skill.requiresSkill);
  };

  const isSkillCompleted = (skill: SkillNode): boolean => {
    const skill_ = userSkills.get(skill.key);
    return skill_ ? skill_.completed : false;
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedText type="title">Beceri Ağacı</ThemedText>
      <ThemedText type="subtitle">SQL becerilerini geliştirin</ThemedText>

      <ThemedView style={styles.summaryCard}>
        <ThemedText type="defaultSemiBold">
          {unlockedCount} / {SKILL_TREE.length} Beceri Açıldı
        </ThemedText>
        <ThemedText>Seviyen: {profile?.level ?? 1}</ThemedText>
      </ThemedView>

      {SKILL_TREE.map((skill) => {
        const isUnlocked = isSkillUnlocked(skill);
        const isCompleted = isSkillCompleted(skill);
        const canUnlock = isUnlocked && !isCompleted;

        return (
          <Pressable
            key={skill.key}
            onPress={() => {
              const isUnlocked = isSkillUnlocked(skill);
              const isCompleted = isSkillCompleted(skill);

              if (!isUnlocked) {
                Alert.alert('Kilitli', 'Bu beceriyi açmak için yeterli seviyeye ulaşmalısınız.');
                return;
              }

              if (isCompleted) {
                Alert.alert('Tamamlandı', 'Bu beceriyi zaten öğrendiniz!');
                return;
              }

              Alert.alert('Başarılı!', `${skill.title} becerisini öğrendiniz!`);
            }}>
            <ThemedView
              style={[
                styles.skillCard,
                isUnlocked && styles.unlockedSkill,
                isCompleted && styles.completedSkill,
                !isUnlocked && styles.lockedSkill,
              ]}>
            <View style={styles.skillHeader}>
              <ThemedText style={styles.icon}>
                {isCompleted ? '✅' : skill.icon}
              </ThemedText>
              <View style={styles.skillInfo}>
                <ThemedText
                  type="defaultSemiBold"
                  style={!isUnlocked && styles.lockedText}>
                  {skill.title}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.description,
                    !isUnlocked && styles.lockedText,
                  ]}>
                  {skill.description}
                </ThemedText>
              </View>
            </View>

            <ThemedView style={styles.requirementsSection}>
              {skill.requiredLevel > 1 && (
                <ThemedText style={styles.requirement}>
                  Seviye {skill.requiredLevel}+
                </ThemedText>
              )}
              {skill.requiresSkill && (
                <ThemedText style={styles.requirement}>
                  Ön şart: {
                    SKILL_TREE.find((s) => s.key === skill.requiresSkill)?.title
                  }
                </ThemedText>
              )}
              {!isUnlocked && (
                <ThemedText style={[styles.requirement, styles.lockedText]}>
                  🔒 Kilitli
                </ThemedText>
              )}
              {isCompleted && (
                <ThemedText style={[styles.requirement, styles.completedText]}>
                  ✓ Tamamlandı
                </ThemedText>
              )}
            </ThemedView>
            </ThemedView>
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
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  skillCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  unlockedSkill: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.03)',
  },
  completedSkill: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  lockedSkill: {
    opacity: 0.5,
  },
  skillHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  icon: {
    fontSize: 32,
  },
  skillInfo: {
    flex: 1,
    gap: 4,
  },
  description: {
    fontSize: 12,
    opacity: 0.7,
  },
  requirementsSection: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
  },
  requirement: {
    fontSize: 12,
    fontWeight: '500',
  },
  lockedText: {
    opacity: 0.5,
  },
  completedText: {
    color: '#10B981',
    fontWeight: '600',
  },
});
