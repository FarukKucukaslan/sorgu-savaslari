import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getChallenges,
  submitSqlAttempt,
  validateSqlForArena,
  updateUserProfileAfterChallenge,
  getModules,
  updateModuleProgress,
  unlockAchievement,
  type Challenge,
  type SubmitSqlAttemptResult,
  type Module,
} from '@/lib/sql-rpg';
import { recordAttempt } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

export default function ArenaScreen() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(false);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [sqlText, setSqlText] = useState('SELECT * FROM goblins ORDER BY hp ASC LIMIT 1');
  const [result, setResult] = useState<SubmitSqlAttemptResult | null>(null);
  const [errorText, setErrorText] = useState('');

  const activeChallenge = useMemo(() => challenges[challengeIndex] ?? null, [challenges, challengeIndex]);

  const loadModules = useCallback(async () => {
    setIsLoadingModules(true);
    try {
      const data = await getModules();
      setModules(data);
      if (data.length > 0 && !selectedModuleId) {
        setSelectedModuleId(data[0].id);
      }
    } catch (error) {
      console.error('Modules yuklenemedi:', error);
    } finally {
      setIsLoadingModules(false);
    }
  }, [selectedModuleId]);

  const loadChallenges = useCallback(async () => {
    if (!selectedModuleId) return;
    
    setIsLoadingChallenges(true);
    setErrorText('');

    try {
      const items = await getChallenges(50);
      const filtered = items.filter((c) => c.moduleId === selectedModuleId);

      if (filtered.length === 0) {
        setChallenges([]);
        setErrorText('Bu modülde henüz challenge yok.');
        return;
      }

      setChallenges(filtered);
      setChallengeIndex(0);
      setResult(null);
      setSqlText('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Challenge yuklenemedi.';
      setErrorText(message);
    } finally {
      setIsLoadingChallenges(false);
    }
  }, [selectedModuleId]);

  const goToPrevious = useCallback(() => {
    if (challengeIndex <= 0) return;
    setChallengeIndex((value) => value - 1);
    setResult(null);
  }, [challengeIndex]);

  const goToNext = useCallback(() => {
    if (challengeIndex >= challenges.length - 1) return;
    setChallengeIndex((value) => value + 1);
    setResult(null);
  }, [challengeIndex, challenges.length]);

  const handleSubmit = useCallback(async () => {
    if (!activeChallenge) {
      Alert.alert('Uyarı', 'Gecerli bir challenge secili degil.');
      return;
    }

    const validation = validateSqlForArena(sqlText);
    if (!validation.ok) {
      Alert.alert('Gecersiz sorgu', validation.reason ?? 'Sorgu gecersiz.');
      return;
    }

    setIsSubmitting(true);
    setResult(null);
    setErrorText('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı oturumu yok.');

      const response = await submitSqlAttempt({
        challengeId: activeChallenge.id,
        sqlText,
      });

      setResult(response);

      // Update profile with XP and stats
      if (response.damage > 0 || response.xpAwarded > 0) {
        await updateUserProfileAfterChallenge(
          user.id,
          response.xpAwarded,
          response.damage,
          response.critical,
          response.success
        );

        // Update module progress
        if (selectedModuleId) {
          await updateModuleProgress(user.id, selectedModuleId, activeChallenge.id, response.success);
        }

        // Unlock achievements
        if (response.success) {
          await unlockAchievement(user.id, 'first_select');
        }
        if (response.critical) {
          await unlockAchievement(user.id, 'first_critical');
        }
      }

      try {
        void recordAttempt(response);
      } catch (e) {
        console.warn('Failed to record attempt', e);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sorgu gonderilemedi.';
      setErrorText(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [activeChallenge, sqlText, selectedModuleId]);

  useEffect(() => {
    void loadModules();
  }, [loadModules]);

  useEffect(() => {
    void loadChallenges();
  }, [loadChallenges]);

  useFocusEffect(
    useCallback(() => {
      void loadModules();
      void loadChallenges();
    }, [loadModules, loadChallenges])
  );

  const selectedModule = modules.find((m) => m.id === selectedModuleId);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">SQL Arena</ThemedText>
      <ThemedText type="subtitle">Sorgu yazarak saldiri yap</ThemedText>

      {/* Module Selection */}
      {isLoadingModules ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <ThemedView style={styles.moduleSelector}>
          <ThemedText type="defaultSemiBold">Modül Seç</ThemedText>
          {modules.map((mod) => (
            <Pressable
              key={mod.id}
              onPress={() => {
                setSelectedModuleId(mod.id);
                setChallengeIndex(0);
                setResult(null);
              }}
              style={[
                styles.moduleButton,
                selectedModuleId === mod.id && styles.moduleButtonActive,
              ]}>
              <ThemedText
                style={selectedModuleId === mod.id ? styles.moduleButtonTextActive : {}}>
                {mod.name}
              </ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      )}

      {/* Challenge Display */}
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Zorluk</ThemedText>
        {isLoadingChallenges ? (
          <ActivityIndicator style={styles.loader} />
        ) : null}
        {activeChallenge ? (
          <>
            <ThemedText>Challenge #{activeChallenge.id}</ThemedText>
            <ThemedText>Zorluk: {activeChallenge.difficulty}</ThemedText>
            <ThemedText>{activeChallenge.prompt}</ThemedText>
            {activeChallenge.hint ? <ThemedText>Ipucu: {activeChallenge.hint}</ThemedText> : null}
          </>
        ) : (
          <ThemedText>Challenge yuklenmedi.</ThemedText>
        )}
        {errorText ? <ThemedText style={styles.errorText}>{errorText}</ThemedText> : null}
      </ThemedView>

      {/* Navigation Buttons */}
      <ThemedView style={styles.row}>
        <Pressable
          style={styles.button}
          onPress={goToPrevious}
          disabled={challengeIndex <= 0 || isLoadingChallenges}>
          <ThemedText type="defaultSemiBold">Onceki</ThemedText>
        </Pressable>
        <Pressable
          style={styles.button}
          onPress={goToNext}
          disabled={challengeIndex >= challenges.length - 1 || isLoadingChallenges}>
          <ThemedText type="defaultSemiBold">Sonraki</ThemedText>
        </Pressable>
        <Pressable
          style={styles.button}
          onPress={loadChallenges}
          disabled={isLoadingChallenges || isSubmitting}>
          <ThemedText type="defaultSemiBold">Yenile</ThemedText>
        </Pressable>
      </ThemedView>

      {/* SQL Input */}
      <ThemedText type="defaultSemiBold">Sorgun</ThemedText>
      <TextInput
        value={sqlText}
        onChangeText={setSqlText}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="SELECT ..."
        style={styles.input}
      />

      {/* Submit Button */}
      <Pressable
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={isSubmitting || isLoadingChallenges}>
        <ThemedText type="defaultSemiBold">
          {isSubmitting ? 'Gonderiliyor...' : 'Sorguyu gonder'}
        </ThemedText>
      </Pressable>

      {/* Result Display */}
      {result ? (
        <ThemedView style={styles.resultCard}>
          <ThemedText type="defaultSemiBold">
            {result.success ? 'Isabetli saldiri!' : 'Sorgu basarisiz.'}
          </ThemedText>
          <ThemedText>Geri bildirim: {result.feedback}</ThemedText>
          <ThemedText>Hasar: {result.damage}</ThemedText>
          <ThemedText>Kritik: {result.critical ? 'Evet' : 'Hayir'}</ThemedText>
          <ThemedText>XP: {result.xpAwarded}</ThemedText>
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
    gap: 12,
  },
  card: {
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B9C0CA',
  },
  moduleSelector: {
    gap: 8,
  },
  moduleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    backgroundColor: '#F3F4F6',
  },
  moduleButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  moduleButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  submitButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  resultCard: {
    gap: 6,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  loader: {
    alignSelf: 'flex-start',
  },
  errorText: {
    color: '#B91C1C',
  },
});
