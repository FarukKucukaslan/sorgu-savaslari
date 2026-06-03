import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getDailyChallenge,
  recordDailyAttempt,
  validateSqlForArena,
  submitSqlAttempt,
  updateUserProfileAfterChallenge,
  unlockAchievement,
} from '@/lib/sql-rpg';
import { supabase } from '@/lib/supabase';
import type { Challenge, SubmitSqlAttemptResult } from '@/lib/sql-rpg';

type DailyChallengeData = Challenge & { dailyChallengeId: number; multiplier: number };

export default function DailyChallengeScreen() {
  const [challenge, setChallenge] = useState<DailyChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sqlText, setSqlText] = useState('');
  const [result, setResult] = useState<SubmitSqlAttemptResult | null>(null);
  const [errorText, setErrorText] = useState('');
  const [todayAttempted, setTodayAttempted] = useState(false);

  const loadChallenge = useCallback(async () => {
    setLoading(true);
    setErrorText('');
    setTodayAttempted(false);
    try {
      const daily = await getDailyChallenge();
      if (!daily) {
        setErrorText('Bugün için challenge hazırlanmadı.');
        setChallenge(null);
      } else {
        setChallenge(daily);
        setSqlText('');
        setResult(null);

        // Check if user already attempted this challenge today
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: attempt } = await supabase
            .from('user_daily_attempts')
            .select('*')
            .eq('user_id', user.id)
            .eq('daily_challenge_id', daily.dailyChallengeId)
            .maybeSingle();

          if (attempt) {
            setTodayAttempted(true);
            setResult({
              success: attempt.success,
              feedback: attempt.success 
                ? 'Bugünkü challenge\'ı zaten başarıyla tamamladın!' 
                : 'Bugünkü challenge denemeni zaten yaptın (Tek katılım hakkı vardır).',
              damage: attempt.success ? 15 : 0,
              critical: false,
              xpAwarded: attempt.xp_earned,
            });
          }
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Challenge yuklenemedi.';
      setErrorText(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!challenge) {
      Alert.alert('Uyarı', 'Challenge yüklenmemiş.');
      return;
    }

    const validation = validateSqlForArena(sqlText);
    if (!validation.ok) {
      Alert.alert('Gecersiz sorgu', validation.reason ?? 'Sorgu gecersiz.');
      return;
    }

    setSubmitting(true);
    setResult(null);
    setErrorText('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı oturumu yok.');

      const response = await submitSqlAttempt({
        challengeId: challenge.id,
        sqlText,
      });

      // Apply multiplier for daily challenge bonus
      const finalXp = Math.floor(response.xpAwarded * challenge.multiplier);
      const finalDamage = Math.floor(response.damage * challenge.multiplier);

      setResult({
        ...response,
        xpAwarded: finalXp,
        damage: finalDamage,
      });

      // Record attempt
      await recordDailyAttempt(user.id, challenge.dailyChallengeId, response.success, finalXp);

      // Update profile
      await updateUserProfileAfterChallenge(
        user.id,
        finalXp,
        finalDamage,
        response.critical,
        response.success
      );

      // Unlock achievements
      if (response.success) {
        await unlockAchievement(user.id, 'first_select');
      }
      if (response.critical) {
        await unlockAchievement(user.id, 'first_critical');
      }

      setTodayAttempted(true);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Sorgu gonderilemedi.';
      setErrorText(msg);
    } finally {
      setSubmitting(false);
    }
  }, [challenge, sqlText]);

  useEffect(() => {
    void loadChallenge();
  }, [loadChallenge]);

  useFocusEffect(
    useCallback(() => {
      void loadChallenge();
    }, [loadChallenge])
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!challenge) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.card}>
          <ThemedText>{errorText}</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.headerSection}>
        <ThemedText type="title">Günlük Challenge</ThemedText>
        <ThemedText type="subtitle">Bonus %{Math.round((challenge.multiplier - 1) * 100)} XP!</ThemedText>
      </ThemedView>

      <ThemedView style={styles.challengeCard}>
        <ThemedText type="defaultSemiBold">Zorluk: {challenge.difficulty}</ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.prompt}>
          {challenge.prompt}
        </ThemedText>
        {challenge.hint && <ThemedText style={styles.hint}>💡 İpucu: {challenge.hint}</ThemedText>}
      </ThemedView>

      <ThemedText type="defaultSemiBold">Sorgun</ThemedText>
      <TextInput
        value={sqlText}
        onChangeText={setSqlText}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="SELECT ..."
        style={styles.input}
        editable={!todayAttempted}
      />

      <Pressable
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={submitting || todayAttempted}>
        <ThemedText type="defaultSemiBold">
          {submitting ? 'Gonderiliyor...' : 'Sorguyu Gonder'}
        </ThemedText>
      </Pressable>

      {errorText ? (
        <ThemedView style={styles.errorCard}>
          <ThemedText style={styles.errorText}>{errorText}</ThemedText>
        </ThemedView>
      ) : null}

      {result ? (
        <ThemedView style={[
          styles.resultCard,
          result.success && styles.successCard,
        ]}>
          <ThemedText type="defaultSemiBold">
            {result.success ? '✅ Başarılı!' : '❌ Başarısız'}
          </ThemedText>
          <ThemedText>{result.feedback}</ThemedText>
          <ThemedView style={styles.resultStats}>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Hasar</ThemedText>
              <ThemedText style={styles.statValue}>{result.damage}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statLabel}>XP</ThemedText>
              <ThemedText style={styles.statValue}>{result.xpAwarded}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Kritik</ThemedText>
              <ThemedText style={styles.statValue}>
                {result.critical ? '⚡' : '-'}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 32,
    gap: 16,
  },
  headerSection: {
    gap: 4,
  },
  challengeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  prompt: {
    fontSize: 16,
    lineHeight: 24,
  },
  hint: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
    fontFamily: 'monospace',
  },
  submitButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#2563EB',
  },
  errorCard: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    gap: 12,
  },
  successCard: {
    borderColor: '#DBEAFE',
    backgroundColor: '#F0F9FF',
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});
