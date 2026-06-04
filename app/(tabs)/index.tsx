import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
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
  recordAttemptToDb,
  type Challenge,
  type SubmitSqlAttemptResult,
  type Module,
} from '@/lib/sql-rpg';
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
      const { data: { user } } = await supabase.auth.getUser();
      
      const items = await getChallenges(50);
      let filtered = items.filter((c) => c.moduleId === selectedModuleId);

      // Başarıyla çözülen soruları exclude et
      if (user) {
        const { data: solvedAttempts } = await supabase
          .from('attempts')
          .select('challenge_id')
          .eq('user_id', user.id)
          .eq('was_success', true);
        
        const solvedIds = new Set(solvedAttempts?.map(a => a.challenge_id) ?? []);
        filtered = filtered.filter(c => !solvedIds.has(c.id));
      }

      if (filtered.length === 0) {
        setChallenges([]);
        setErrorText('Bu modülde tüm soruları başarıyla çözmüşsün!');
        return;
      }

      // FIXED: Eğer önceki modülden soruları değişmiyorsa index reset etme
      setChallenges(filtered);
      if (challenges.length === 0) {
        setChallengeIndex(0);
        setResult(null);
        setSqlText('');
      }
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

  // Sorguyu gönderme butonuna tıklandığında tetiklenen ana fonksiyon
  const handleSubmit = useCallback(async () => {
    // 1. Seçili bir soru (challenge) olup olmadığını denetle
    if (!activeChallenge) {
      Alert.alert('Uyarı', 'Geçerli bir challenge seçili değil.');
      return;
    }

    // 2. SQL sorgusunun basit güvenlik ve kural denetimlerini istemci tarafında (client-side) yap
    const validation = validateSqlForArena(sqlText);
    if (!validation.ok) {
      Alert.alert('Geçersiz sorgu', validation.reason ?? 'Sorgu geçersiz.');
      return;
    }

    setIsSubmitting(true);
    setResult(null);
    setErrorText('');

    try {
      // 3. Oturum açmış aktif kullanıcı bilgisini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı oturumu yok.');

      // 4. Supabase Edge Function'ı (submit-sql) çağırarak SQL sorgusunu sunucuda çalıştır ve sonucu al
      const response = await submitSqlAttempt({
        challengeId: activeChallenge.id,
        sqlText,
      });

      setResult(response);

      // 5. Eğer soru daha önce çözülmemişse (alreadySolved = false), oyuncunun profil istatistiklerini güncelle
      if (!response.alreadySolved) {
        // Kullanıcı profiline hasar, XP ekle, deneme sayısını artır ve kombo durumunu işle
        const updatedProfile = await updateUserProfileAfterChallenge(
          user.id,
          response.xpAwarded,
          response.damage,
          response.critical,
          response.success
        );

        // 6. Eğer aktif bir modül seçiliyse modül ilerlemesini (progress) güncelle
        if (selectedModuleId) {
          const moduleProgress = await updateModuleProgress(user.id, selectedModuleId, activeChallenge.id, response.success);
          
          // Modül %100 tamamlandıysa ilgili modül tamamlama başarımını (achievement) aç
          if (moduleProgress.completed) {
            const moduleAchievementMap: Record<number, string> = {
              1: 'select_master',
              2: 'filter_master',
              3: 'sort_master',
              4: 'group_master',
              5: 'advanced_master',
            };
            
            const moduleAchievementKey = moduleAchievementMap[selectedModuleId];
            if (moduleAchievementKey) {
              achievementXp += await unlockAchievement(user.id, moduleAchievementKey);
            }
            
            // Eğer 5 modülün hepsi tamamlandıysa 'all_modules_done' başarımını aç
            const { data: allProgress } = await supabase
              .from('user_module_progress')
              .select('completed')
              .eq('user_id', user.id);
            
            if (allProgress && allProgress.length === 5 && allProgress.every(p => p.completed)) {
              achievementXp += await unlockAchievement(user.id, 'all_modules_done');
            }
          }
        }

        // 7. Oyuncunun yeni istatistiklerine göre başarım (achievement) kilitlerini aç
        let achievementXp = 0;
        
        // İlk başarılı sorgu ve ilk kritik vuruş başarımları
        if (response.success) {
          achievementXp += await unlockAchievement(user.id, 'first_select');
        }
        if (response.critical) {
          achievementXp += await unlockAchievement(user.id, 'first_critical');
        }

        // Kombo başarımları (3, 5 ve 10 kombo serileri)
        if (updatedProfile.currentCombo >= 3) {
          achievementXp += await unlockAchievement(user.id, 'combo_3');
        }
        if (updatedProfile.currentCombo >= 5) {
          achievementXp += await unlockAchievement(user.id, 'combo_5');
        }
        if (updatedProfile.currentCombo >= 10) {
          achievementXp += await unlockAchievement(user.id, 'combo_10');
        }

        // Toplam kritik vuruş başarımları (5 ve 10 kritik)
        if (updatedProfile.totalCriticalHits >= 5) {
          achievementXp += await unlockAchievement(user.id, 'critical_hit_5');
        }
        if (updatedProfile.totalCriticalHits >= 10) {
          achievementXp += await unlockAchievement(user.id, 'critical_hit_10');
        }

        // Toplam hasar başarımı (1000 Hasar)
        if (updatedProfile.totalDamage >= 1000) {
          achievementXp += await unlockAchievement(user.id, 'damage_1000');
        }

        // Toplam XP başarımı (1000 XP)
        if (updatedProfile.totalXp >= 1000) {
          achievementXp += await unlockAchievement(user.id, 'xp_1000');
        }

        // Seviye başarımları (5 ve 10. seviyeler)
        if (updatedProfile.level >= 5) {
          achievementXp += await unlockAchievement(user.id, 'level_5');
        }
        if (updatedProfile.level >= 10) {
          achievementXp += await unlockAchievement(user.id, 'level_10');
        }

        // Eğer başarımlardan XP kazanıldıysa bunu oyuncu profiline ekle ve gerekirse seviye atlat
        if (achievementXp > 0) {
          const newTotalXp = updatedProfile.totalXp + achievementXp;
          const newLevel = Math.floor(1 + newTotalXp / 500);
          
          await supabase
            .from('user_profiles')
            .update({
              total_xp: newTotalXp,
              level: newLevel,
              last_active: new Date().toISOString(),
            })
            .eq('user_id', user.id);
        }
      }

      // 8. Bu denemeyi tarihçe (log) olarak 'attempts' tablosuna kaydet
      try {
        void recordAttemptToDb(user.id, activeChallenge.id, sqlText, response);
      } catch (e) {
        console.warn('Failed to record attempt', e);
      }

      // 9. Başarılı çözüm yapıldıysa 2 saniye sonra otomatik olarak sonraki soruya geçiş yap
      if (response.success || response.alreadySolved) {
        setTimeout(() => {
          goToNext();
        }, 2000);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sorgu gönderilemedi.';
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
  }, [selectedModuleId, loadChallenges]);

  useFocusEffect(
    useCallback(() => {
      // Tab açılınca modules refresh et ama challenges'ı reset etme
      void loadModules();
    }, [loadModules])
  );

  const selectedModule = modules.find((m) => m.id === selectedModuleId);

  return (
    <ScrollView contentContainerStyle={styles.container} scrollEnabled={true}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
