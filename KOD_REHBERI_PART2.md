# Sorgu Savaşları - Detaylı Kod Açıklama Rehberi (Part 2) ⚔️

Bu rehber, [KOD_REHBERI.md](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/KOD_REHBERI.md) dosyasında yer almayan tüm diğer ekranları ve backend controller dosyalarını tek tek kod blokları ve detaylı satır açıklamaları halinde ele alır.

---

## 📁 1. `app/(tabs)/` Klasörü (Alt Navigasyon ve Ekranlar)

### 📄 [app/(tabs)/_layout.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/_layout.tsx)

Uygulamanın alt kısmındaki menü tuşlarını ve hangi ekranın hangi isimle çağrılacağını yapılandıran yerleşim dosyasıdır.

---

#### 1. Kütüphane Yüklemeleri (Imports)
```typescript
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
```
* **Açıklama:** Sayfa geçişleri için `Tabs` bileşenini, titreşim özelliği için `HapticTab`'i, simgeler için `IconSymbol`'ü, renk temaları ve cihazın o anki koyu/açık modunu okuyabilmek için gerekli kütüphaneleri çağırıyoruz.

---

#### 2. TabLayout Fonksiyonu ve Menü Yapılandırması
```typescript
export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
```
* **Açıklama:** Alt menüyü çizen ana fonksiyonumuzdur. Cihazın temasına göre aktif olan simgenin rengini (`tabBarActiveTintColor`) ve pasif simgelerin rengini belirler. `headerShown: false` diyerek ekranların tepesindeki boş çubuğu kaldırır ve menü butonlarının basıldığında titremesi için `tabBarButton: HapticTab` atamasını yapar.

---

#### 3. Menü Sekmelerinin (Screens) Tanımlanması
```typescript
      <Tabs.Screen
        name="index"
        options={{
          title: 'Arena',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chevron.left.forwardslash.chevron.right" color={color} />,
        }}
      />
      <Tabs.Screen
        name="daily-challenge"
        options={{
          title: 'Günlük',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="sun.max.fill" color={color} />,
        }}
      />
```
* **Açıklama:** Alt menüdeki butonları tek tek tanımlarız. `name="index"` dosya adı olan `index.tsx` (Arena ekranı) dosyasını çağırır ve ona özel bir SQL ikonu koyar. `name="daily-challenge"` ise Günlük Görev ekranını (`daily-challenge.tsx`) çağırır ve ona güneş ikonu atar. (Diğer sekmeler olan Başarılar, Liderlik ve Profil ekranları da benzer şekilde tanımlanmıştır).

---

### 📄 [app/(tabs)/achievements.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/achievements.tsx)

Oyundaki kilitli ve açılmış tüm başarımları listeleyen ekrandır.

---

#### 1. Başarımları Çekme Mantığı (`loadAchievements`)
```typescript
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
```
* **Açıklama:** 
  * `supabase.auth.getUser()`: Aktif oyuncunun kimliğini öğreniriz.
  * `getAchievements()` ve `getUserAchievements()`: Veritabanındaki tüm başarımları ve oyuncunun o ana kadar kazandığı başarımları listeleriz.
  * `unlockedIds`: Kazanılan başarımların ID'lerini bir kümede (`Set`) toplayarak hızlıca kontrol edilmesini sağlarız.
  * `totalXpEarned`: Oyuncunun kazandığı tüm başarımlardan elde ettiği toplam tecrübe puanını (XP) toplarız.
  * `withStatus`: Tüm başarımları tek tek gezip, eğer oyuncunun kazandıkları listesindeyse `unlocked: true`, değilse `unlocked: false` olarak işaretleriz.

---

#### 2. Ekranın Çizilmesi ve Kilit Kontrolleri
```typescript
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
```
* **Açıklama:** Başarımları ekranda listelerken eğer başarım kilitliyse (`!unlocked`) kartın görünürlüğünü azaltırız (`lockedCard` stili ile yarı şeffaf yaparız) ve başarım simgesi yerine asma kilit (`🔒`) koyarız. Eğer açılmışsa kendi özgün simgesini (örneğin kılıç, madalya) çizeriz.

---

### 📄 [app/(tabs)/daily-challenge.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/daily-challenge.tsx)

Her güne özel 1 kez denenebilen, yüksek puan çarpanlı özel SQL Arena ekranıdır.

---

#### 1. Günlük Görevi ve Oyuncunun Deneme Durumunu Yükleme (`loadChallenge`)
```typescript
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

        // Kullanıcı bugün deneme yaptı mı?
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
       // hata loglama...
    } finally {
      setLoading(false);
    }
  }, []);
```
* **Açıklama:**
  * `getDailyChallenge()`: Veritabanından o güne ait belirlenmiş olan günlük soruyu çeker.
  * `user_daily_attempts` tablosu sorgusu: Oyuncunun bugün bu göreve daha önce katılıp katılmadığını kontrol eder.
  * Eğer bugün deneme yapılmışsa `setTodayAttempted(true)` yapılarak giriş engellenir ve oyuncuya eski deneme sonucu (başarılı veya başarısız geri bildirimi) ekranda gösterilir.

---

#### 2. Sorguyu Gönderme ve Çarpanlı Puan Hesaplama (`handleSubmit`)
```typescript
      const response = await submitSqlAttempt({
        challengeId: challenge.id,
        sqlText,
      });

      // Günlük görev bonus çarpanını uygula (örn: 1.5x)
      const finalXp = Math.floor(response.xpAwarded * challenge.multiplier);
      const finalDamage = Math.floor(response.damage * challenge.multiplier);

      setResult({
        ...response,
        xpAwarded: finalXp,
        damage: finalDamage,
      });

      // Günlük deneme geçmişine kaydet
      await recordDailyAttempt(user.id, challenge.dailyChallengeId, response.success, finalXp);
```
* **Açıklama:** Oyuncu yazdığı SQL kodunu gönderdiğinde normal bir sorudan alacağı hasar ve XP puanı, o güne özel belirlenen çarpanla (`multiplier`) çarpılır (örneğin %50 fazla puan için 1.5 ile çarpılır). Ardından bu deneme veritabanındaki günlük denemeler tablosuna (`recordDailyAttempt`) tek seferlik hak bittiği için kaydedilir.

---

### 📄 [app/(tabs)/leaderboard.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/leaderboard.tsx)

Uygulamadaki tüm oyuncuları kazandıkları toplam tecrübe puanına (XP) göre sıralayan ekrandır.

---

#### 1. Liderlik Tablosunu Yükleme (`loadLeaderboard`)
```typescript
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
```
* **Açıklama:** `getLeaderboard(100)` fonksiyonuyla oyundaki en yüksek tecrübeli ilk 100 kullanıcıyı çekeriz. Ayrıca kendi kullanıcımızın satırını listede farklı renkte gösterebilmek için o an giriş yapmış olan oyuncunun ID'sini (`currentUserId`) kaydederiz.

---

#### 2. Derece Rozetleri ve Kendini Vurgulama Mantığı
```typescript
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
```
* **Açıklama:** Liste döngüsünde (`map`), ilk 3 sıradaki oyuncuların yanına sayı yerine altın, gümüş ve bronz madalya simgeleri (`🥇`, `🥈`, `🥉`) koyarız. Eğer satırdaki oyuncunun ID'si bizim ID'miz ile eşleşiyorsa (`isCurrentUser`), satırın arka plan rengini yeşilimsi yaparak (`currentUserCard` stili) kendimizi listede kolayca ayırt etmemizi sağlarız.

---

### 📄 [app/(tabs)/profile.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/profile.tsx)

Kullanıcının seviyesini (Level), kazandığı XP'yi, kombo rekorunu ve başarı oranını gösteren grafiksel istatistik ekranıdır.

---

#### 1. Seviye İlerleme Çubuğu Hesabı
```typescript
  const nextLevelXp = (profile.level * 500);
  const currentLevelXp = ((profile.level - 1) * 500);
  const xpInLevel = profile.totalXp - currentLevelXp;
  const xpForNextLevel = nextLevelXp - currentLevelXp;
  const progressPercent = Math.min(100, (xpInLevel / xpForNextLevel) * 100);
```
* **Açıklama:** Oyunda her 500 XP'de bir seviye atlanmaktadır. 
  * Örneğin oyuncu 3. seviyedeyse, bir sonraki seviye sınırı `3 * 500 = 1500 XP`'dir. Bulunduğu seviyenin başlangıç sınırı ise `2 * 500 = 1000 XP`'dir.
  * Oyuncunun o seviye içinde kazandığı güncel XP'sini (`xpInLevel`) ve seviye atlamak için gereken toplam farkı (`xpForNextLevel`) hesaplayarak, ekrandaki ilerleme çubuğunun yüzde kaç dolacağını (`progressPercent`) buluruz.

---

#### 2. Başarı Oranı Hesabı
```typescript
  const successRate = profile.totalAttempts > 0 
    ? ((profile.totalSuccesses / profile.totalAttempts) * 100).toFixed(1)
    : '0.0';
```
* **Açıklama:** Oyuncunun canavarlara karşı yazdığı toplam SQL denemelerinden (`totalAttempts`) kaç tanesinin doğru sonuçlandığını (`totalSuccesses`) birbirine bölerek yüzde bazında başarı oranını hesaplarız. Virgülden sonra yalnızca tek basamak gösterilmesini sağlarız (örneğin %72.5).

---

## 📁 2. `backend/src/arena/` Klasörü (API Kontrol Noktaları)

### 📄 [backend/src/arena/arena.controller.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/backend/src/arena/arena.controller.ts)

Uygulamanın internet üzerinden sunucuya gönderdiği istekleri karşılayan ve yanıtları döndüren NestJS kontrolcü (routing) dosyasıdır.

---

#### 1. Tüm Soruları Getiren Endpoint (`/questions`)
```typescript
  @Get('questions')
  async getArenaQuestions() {
    return this.arenaService.getArenaQuestions();
  }
```
* **Açıklama:** Telefon ekranından `GET http://sunucu-adresi/api/arena/questions` adresine bir istek geldiğinde bu fonksiyon çalışır ve `ArenaService` aracılığıyla veritabanındaki tüm arena sorularını telefona teslim eder.

---

#### 2. Skorları Kaydeden Endpoint (`/submit-score`)
```typescript
  @Post('submit-score')
  async submitScore(
    @Body()
    body: {
      userId: string;
      questionId: string;
      isCorrect: boolean;
      timeSpent: number;
    },
  ) {
    if (!body.userId || !body.questionId) {
      throw new BadRequestException('userId ve questionId zorunludur');
    }

    return this.arenaService.submitScore(
      body.userId,
      body.questionId,
      body.isCorrect,
      body.timeSpent,
    );
  }
```
* **Açıklama:** Oyuncu bir soruyu çözüp skoru kaydetmek istediğinde bu `POST` uç noktasına veri paketini yollar. 
  * Kontrolcü, gelen veride kullanıcı ID veya soru ID'sinin boş olup olmadığını denetler. 
  * Eksik varsa `400 Bad Request` hatası fırlatır. 
  * Bilgiler tamsa, puanı hesaplaması ve veritabanına eklemesi için işi `ArenaService` içerisindeki `submitScore` fonksiyonuna devreder.
