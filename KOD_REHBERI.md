# Sorgu Savaşları - Blok Blok Kod Açıklama Rehberi ⚔️

Bu rehber, **Sorgu Savaşları (SQL Arena)** projesindeki her bir kod dosyasını, dosya içindeki her bir **kod bloğunu ve fonksiyonu** tek tek ele alarak, yazılım dünyasına tamamen yabancı birinin anlayabileceği şekilde açıklar.

---

## 📁 1. `src/lib/` Klasörü (Ortak Yardımcı Araçlar)

Bu klasör, uygulamanın diğer kısımlarının işlerini kolaylaştıran, veritabanı ile konuşan ve oyun mantığını yürüten ana araçları içerir.

### 📄 [src/lib/supabase.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/src/lib/supabase.ts)

Bu dosya, uygulamanın bulut veritabanına (`Supabase`) bağlanmasını sağlayan ana telefon hattıdır.

---

#### 1. Kütüphane Yüklemeleri (Imports)
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
```
* **Açıklama:** Dış dünyadan hazır araçlar ödünç alıyoruz. 
  * `AsyncStorage`: Telefonun kalıcı hafızasına veri kaydetmek için (deftere not yazmak gibi).
  * `createClient`: Supabase veritabanıyla konuşabilmemiz için gerekli resmi bağlantı motoru.
  * `Platform`: Kodun o an bir internet tarayıcısında mı (Web) yoksa cep telefonunda mı (iOS/Android) çalıştığını anlamamızı sağlar.

---

#### 2. Bağlantı Bilgilerinin Kontrolü
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Supabase environment variables are missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your .env file.'
  );
}
```
* **Açıklama:** Veritabanının internetteki açık adresini (`supabaseUrl`) ve kapıyı açacak şifresini (`supabasePublishableKey`) gizli ayar dosyasından okuyoruz. Eğer bu iki bilgi eksikse, uygulama çalışmayı reddeder ve "Adres ve şifre olmadan veritabanına bağlanamam!" diye hata verir.

---

#### 3. Akıllı Hafıza Adaptörü (`customStorage`)
```typescript
const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};
```
* **Açıklama:** Oyuncunun oturum bilgilerini (giriş yapıp yapmadığını) hatırlayan akıllı bir hafıza kutusudur. 
  * Eğer oyuncu **web tarayıcısından** giriyorsa tarayıcının hafızasını (`localStorage`), **cep telefonundan** giriyorsa telefonun kalıcı hafızasını (`AsyncStorage`) kullanarak bilgileri okur (`getItem`), kaydeder (`setItem`) veya siler (`removeItem`).

---

#### 4. Supabase Bağlantısının Başlatılması
```typescript
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```
* **Açıklama:** Yukarıdaki adres, şifre ve hafıza kutusunu kullanarak resmi veritabanı bağlantımızı (`supabase`) kuruyoruz. `autoRefreshToken: true` sayesinde kullanıcının giriş süresi bittiğinde arka planda otomatik yenilenir.

---

### 📄 [src/lib/api-client.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/src/lib/api-client.ts)

Bu dosya, mobil uygulamanın kendi bilgisayarımızda çalışan arka yüz sunucusuyla (`NestJS backend`) konuşmasını sağlayan postacıdır.

---

#### 1. Sunucu Adresinin Tanımlanması
```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
```
* **Açıklama:** Sunucunun hangi internet adresinde çalıştığını belirler. Eğer ayarlarda özel bir adres yoksa varsayılan olarak bilgisayarımızın iç adresi olan `localhost:3001` portuna mektup gönderir.

---

#### 2. ApiClient Sınıfı ve GET İstek Bloğu
```typescript
export class ApiClient {
  static async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  }
```
* **Açıklama:** Sunucudan bilgi talep etmek için kullanılan **"Bana Bilgi Getir"** butonudur. Adrese gider, bilgiyi alır. Eğer sunucu bozuksa veya sayfa yoksa hata fırlatır.

---

#### 3. POST İstek Bloğu
```typescript
  static async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  }
}
```
* **Açıklama:** Sunucuya yeni veri kaydetmesi için bilgi gönderen **"Bu Paketi Sunucuya Teslim Et"** butonudur. Gönderilecek veriyi JSON denilen dijital bir pakete dönüştürerek yollar.

---

#### 4. ArenaApi İstek Grupları
```typescript
export class ArenaApi {
  static async getArenaQuestions() {
    return ApiClient.get('/api/arena/questions');
  }

  static async getQuestion(questionId: string) {
    return ApiClient.get(`/api/arena/questions/${questionId}`);
  }

  static async submitScore(userId: string, questionId: string, isCorrect: boolean, timeSpent: number) {
    return ApiClient.post('/api/arena/submit-score', {
      userId,
      questionId,
      isCorrect,
      timeSpent,
    });
  }

  static async getLeaderboard() {
    return ApiClient.get('/api/arena/leaderboard');
  }

  static async getUserScore(userId: string) {
    return ApiClient.get(`/api/arena/leaderboard/${userId}`);
  }
}
```
* **Açıklama:** Oyun içindeki özel görevleri adlandıran kısa yollardır. Örneğin `submitScore` çağrıldığında, arka planda sunucunun `/api/arena/submit-score` adresine oyuncunun bilgilerini ve skorunu paketleyip gönderir.

---

### 📄 [src/lib/sql-rpg.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/src/lib/sql-rpg.ts)

Burası oyunun tüm RPG kurallarının (hasarlar, seviyeler, başarımlar, veritabanı sorguları) hesaplandığı **oyun motorudur**.

---

#### 1. Veri Yapısı Şablonları (Types)
```typescript
export type Challenge = {
  id: number;
  prompt: string;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  hint: string | null;
  expectedSignature: string | null;
  moduleId?: number | null;
  orderInModule?: number;
  requiredXp?: number;
};
```
* **Açıklama:** Oyundaki "Soru" (Challenge) kavramının içinde nelerin bulunması gerektiğini tanımlayan bir kalıptır. Her sorunun mutlaka bir numarası (`id`), açıklaması (`prompt`), zorluğu ve ipucu olmalıdır. Bu dosyanın başında `Module`, `UserProfile`, `Achievement` gibi tüm oyun içi kavramların kalıpları tanımlanır.

---

#### 2. SQL Güvenlik Kontrol Bloğu (`validateSqlForArena`)
```typescript
export function validateSqlForArena(sqlText: string): { ok: boolean; reason?: string } {
  const trimmed = sqlText.trim();

  if (!trimmed) {
    return { ok: false, reason: 'Sorgu bos olamaz.' };
  }

  if (trimmed.includes(';')) {
    return { ok: false, reason: 'Guvenlik icin noktali virgul kullanma.' };
  }

  if (!/^select\b/i.test(trimmed)) {
    return { ok: false, reason: 'Sadece SELECT sorgularina izin verilir.' };
  }

  if (/\b(insert|update|delete|drop|alter|create|grant|revoke|truncate)\b/i.test(trimmed)) {
    return { ok: false, reason: 'Yazma veya DDL komutlari yasak.' };
  }

  return { ok: true };
}
```
* **Açıklama:** Oyuncunun yazdığı SQL kodunu denetleyen **güvenlik filtresidir**. 
  * Boş sorguları eler.
  * Noktali virgülü (`;`) yasaklar (çünkü yan yana birden fazla sorgu yazıp veritabanını hacklemeye çalışabilirler).
  * Sadece veri okuma olan `SELECT` komutuna izin verir. Tablo silen, değiştiren veya veri ekleyen (`DROP`, `DELETE`, `UPDATE`) komutları yakalayıp engeller.

---

#### 3. Soruları Getirme Bloğu (`getChallenges`)
```typescript
export async function getChallenges(limit = 10): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('id, prompt, difficulty, hint, expected_signature, module_id, order_in_module, required_xp')
    .order('id', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => ({
    id: Number(item.id),
    prompt: item.prompt,
    difficulty: item.difficulty,
    hint: item.hint,
    expectedSignature: item.expected_signature ?? null,
    moduleId: item.module_id ?? null,
    orderInModule: item.order_in_module ?? 0,
    requiredXp: item.required_xp ?? 0,
  }));
}
```
* **Açıklama:** Veritabanındaki `challenges` tablosuna gider, belirlenen miktarda (`limit`) soruyu ID sırasına göre alır, JavaScript dilinin anlayacağı temiz nesnelere dönüştürür ve geri döner.

---

#### 4. Sorguyu Sunucuya Gönderme Bloğu (`submitSqlAttempt`)
```typescript
export async function submitSqlAttempt({
  challengeId,
  sqlText,
}: SubmitSqlAttemptParams): Promise<SubmitSqlAttemptResult> {
  const { data, error } = await supabase.functions.invoke<SubmitSqlAttemptResult>('submit-sql', {
    body: {
      challengeId,
      sql: sqlText,
    },
  });

  if (error) {
    // ...hata detaylarını ayrıştırma mantığı...
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Fonksiyon bos cevap dondurdu.');
  }

  return data;
}
```
* **Açıklama:** Oyuncunun cevabını veritabanındaki özel bulut koduna (`submit-sql`) gönderir. Buluttan gelen başarılı/başarısız bilgisini, canavara verilen hasarı ve kazanılan tecrübe puanını içeren paketi alır ve geri döndürür.

---

#### 5. Oyuncu Profilini Güncelleme Bloğu (`updateUserProfileAfterChallenge`)
```typescript
export async function updateUserProfileAfterChallenge(
  userId: string,
  xpEarned: number,
  damageDone: number,
  wasCritical: boolean,
  wasSuccess: boolean
): Promise<UserProfile> {
  let profile = await getUserProfile(userId);
  if (!profile) {
    profile = await getOrCreateUserProfile(userId, `Player_${userId.substring(0, 8)}`);
  }

  const newTotalXp = profile.totalXp + xpEarned;
  const newLevel = Math.floor(1 + newTotalXp / 500);
  const newCombo = wasSuccess ? profile.currentCombo + 1 : 0;
  const newBestCombo = Math.max(profile.bestCombo, newCombo);

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      total_xp: newTotalXp,
      level: newLevel,
      total_damage: profile.totalDamage + damageDone,
      total_critical_hits: profile.totalCriticalHits + (wasCritical ? 1 : 0),
      total_successes: profile.totalSuccesses + (wasSuccess ? 1 : 0),
      total_attempts: profile.totalAttempts + 1,
      current_combo: newCombo,
      best_combo: newBestCombo,
      last_active: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapUserProfile(data);
}
```
* **Açıklama:** Oyuncu bir soruyu çözdükten sonra karakter profilini güncelleyen kısımdır.
  * Oyuncunun kazandığı tecrübe puanını (`xpEarned`) eski puanına ekler.
  * **Seviye Hesabı:** Her 500 tecrübe puanında 1 seviye atlatır (`Math.floor(1 + newTotalXp / 500)`).
  * **Kombo Hesabı:** Eğer cevap doğruysa (`wasSuccess`) kombo sayısını 1 artırır, yanlışsa sıfırlar. En yüksek kombo rekorunu günceller.
  * Yeni verileri veritabanındaki `user_profiles` tablosuna yazar.

---

## 📁 2. `src/components/` Klasörü (Görsel Ekran Yapı Taşları)

Ekranlarda tekrar tekrar kullanılan düğmeler, yazılar ve kutular gibi ortak arayüz elemanlarını içerir.

### 📄 [src/components/haptic-tab.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/src/components/haptic-tab.tsx)

```typescript
export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
```
* **Açıklama:** Alt menü tuşlarına tıklandığında telefona hafif bir **titreme etkisi** verir.
  * `onPressIn`: Oyuncu parmağını tuşa bastığı an tetiklenir.
  * `EXPO_OS === 'ios'`: Sadece iPhone telefonlarda çalışır (çünkü hafif pürüzsüz titreşimler iOS tarafında daha belirgindir) ve hafif bir dokunma hissi (`Light` titreşim) üretir.

---

### 📄 [src/components/themed-text.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/src/components/themed-text.tsx)

```typescript
export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
```
* **Açıklama:** Uygulama içindeki tüm yazıları renklendiren ve şekillendiren şablondur.
  * `useThemeColor`: Telefonun o anki koyu/açık temasına göre yazı rengini (`color`) otomatik seçer.
  * `type` kontrolü: Yazının başlık mı (`title`), kalın mı (`defaultSemiBold`) yoksa internet bağlantısı mı (`link`) olduğunu kontrol edip alt tarafta tanımlı olan CSS yazı boyutlarını ekrana basar.

---

## 📁 3. `app/` Klasörü (Oyun Sayfaları)

Bu klasördeki her `.tsx` dosyası, oyuncunun cep telefonunda gördüğü bağımsız birer ekrandır.

### 📄 [app/_layout.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/_layout.tsx)

Uygulamanın ana iskeletidir. Uygulama açılır açılmaz burası yüklenir.

---

#### 1. Otomatik Misafir Giriş Bloğu (`useEffect`)
```typescript
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) {
            console.warn('Anon login failed:', error);
          } else {
            console.log('Anon logged in:', data.user?.id);
          }
        } else {
          console.log('User already logged in:', user.id);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      }
    };
    
    initAuth();
  }, []);
```
* **Açıklama:** Uygulama açıldığında ilk kez çalışan başlangıç kodudur.
  * `supabase.auth.getUser()`: Oyuncunun telefonunda daha önce açık kalmış bir oturum olup olmadığına bakar.
  * `signInAnonymously()`: Eğer açık oturum yoksa, oyuncuyu hiç uğraştırmadan arka planda ona **geçici bir misafir hesabı** açar. Böylece üye olma ekranı görmeden direkt oyuna girmesi sağlanır.

---

#### 2. Arayüz Çizimi
```typescript
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
```
* **Açıklama:** Ekranın renk temasını belirler ve alt menüyü barındıran `(tabs)` grubunu ana ekrana yükler. `headerShown: false` diyerek ekranın tepesindeki çirkin gri başlık çubuğunu gizler.

---

### 📄 [app/(tabs)/index.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/index.tsx)

Oyuncunun SQL yazarak canavarlarla savaştığı ana **"SQL Arena"** ekranıdır.

---

#### 1. Modülleri Yükleme Bloğu (`loadModules`)
```typescript
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
```
* **Açıklama:** Veritabanındaki oyun bölümlerini (Modüller: Veri Çekme, Filtreleme, Sıralama vs.) çeker. Eğer oyuncu daha önce hiçbir şey seçmediyse otomatik olarak birinci modülü seçili hale getirir.

---

#### 2. Soruları Yükleme ve Çözülenleri Gizleme Bloğu (`loadChallenges`)
```typescript
  const loadChallenges = useCallback(async () => {
    if (!selectedModuleId) return;
    setIsLoadingChallenges(true);
    setErrorText('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const items = await getChallenges(50);
      let filtered = items.filter((c) => c.moduleId === selectedModuleId);

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

      setChallenges(filtered);
    } catch (error) {
      setErrorText('Challenge yuklenemedi.');
    } finally {
      setIsLoadingChallenges(false);
    }
  }, [selectedModuleId]);
```
* **Açıklama:** Seçilen modüle ait soruları veritabanından getirir.
  * Oyuncunun daha önce bu modülde başarılı bir şekilde çözdüğü soruların listesini (`attempts` tablosundan) çeker.
  * Çözülmüş soruları listeden eler (`filter`). Eğer çözülecek hiç soru kalmadıysa ekranda "Tüm soruları bitirdin!" tebrik mesajını gösterir.

---

#### 3. Sorgu Gönderme ve Ödül Hesaplama Bloğu (`handleSubmit`)
```typescript
  const handleSubmit = useCallback(async () => {
    if (!activeChallenge) return;

    const validation = validateSqlForArena(sqlText);
    if (!validation.ok) {
      Alert.alert('Gecersiz sorgu', validation.reason ?? 'Sorgu gecersiz.');
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı oturumu yok.');

      const response = await submitSqlAttempt({
        challengeId: activeChallenge.id,
        sqlText,
      });

      setResult(response);

      if (!response.alreadySolved) {
        const updatedProfile = await updateUserProfileAfterChallenge(
          user.id,
          response.xpAwarded,
          response.damage,
          response.critical,
          response.success
        );
        
        // ... başarımları açma ve veritabanı kayıt mantığı ...
      }
```
* **Açıklama:** Oyuncu **"Sorguyu Gönder"** butonuna bastığında çalışan devasa bloktur.
  * Önce yazdığı kodun güvenliğini denetler (`validateSqlForArena`).
  * Kod güvenliyse bulut fonksiyonuna (`submitSqlAttempt`) gönderir.
  * Buluttan gelen cevaba göre canavarın aldığı hasarı ve kazanılan ödülleri ekrana basar.
  * Oyuncunun profil istatistiklerini (XP, Seviye) günceller.
  * Eğer oyuncu bu soruyla beraber bir şartı yerine getirdiyse (Örn: 3 kez üst üste doğru cevap verdi veya 1000 toplam hasara ulaştı), başarımların kilitlerini açar.

---

## 📁 4. `backend/` Klasörü (Arka Plan Hizmet Birimi)

Uygulamanın internet üzerinden istek gönderdiği NestJS tabanlı sunucu kısmıdır.

### 📄 [backend/src/arena/arena.service.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/backend/src/arena/arena.service.ts)

Sunucuda oyun hesaplamalarının yapıldığı yerdir.

---

#### 1. Skor Kaydetme ve Zaman Bonusu Hesaplama Bloğu (`submitScore`)
```typescript
  async submitScore(
    userId: string,
    questionId: string,
    isCorrect: boolean,
    timeSpent: number,
  ) {
    try {
      const supabase = this.supabaseService.getClient();

      const { data: questionData } = await supabase
        .from('arena_questions')
        .select('correct_answer')
        .eq('id', questionId)
        .single();

      if (!questionData) {
        throw new Error('Soru bulunamadı');
      }

      let points = isCorrect ? 10 : 0;
      if (isCorrect && timeSpent < 30) {
        points += 5; // 30 saniyenin altında çözdüyse hızlı cevap bonusu
      }

      const { data, error } = await supabase.from('user_scores').insert([
        {
          user_id: userId,
          question_id: questionId,
          is_correct: isCorrect,
          points: points,
          time_spent: timeSpent,
          created_at: new Date().toISOString(),
        },
      ]);
      // ...
```
* **Açıklama:** Oyuncunun testi bitirdikten sonra aldığı puanı hesaplar.
  * Oyuncu doğru cevap verdiyse temel 10 puan alır.
  * **Hızlı Cevap Bonusu:** Eğer oyuncu soruyu 30 saniyeden kısa sürede çözdüyse (`timeSpent < 30`), hanesine fazladan 5 puan yazar.
  * Sonuçları veritabanındaki `user_scores` tablosuna kalıcı olarak kaydeder.

---

#### 2. Liderlik Tablosu Oluşturma Bloğu (`getLeaderboard`)
```typescript
  async getLeaderboard() {
    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase
        .from('user_scores')
        .select('user_id, points')
        .order('points', { ascending: false })
        .limit(100);

      const leaderboard = {};
      data.forEach((row) => {
        if (leaderboard[row.user_id]) {
          leaderboard[row.user_id] += row.points || 0;
        } else {
          leaderboard[row.user_id] = row.points || 0;
        }
      });

      const topUsers = Object.entries(leaderboard)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 10)
        .map(([userId, points], rank) => ({
          rank: rank + 1,
          userId,
          totalPoints: points,
        }));

      return { success: true, leaderboard: topUsers };
    } catch (error) {
      // ...
```
* **Açıklama:** En yüksek puana sahip ilk 10 oyuncuyu hesaplar.
  * Veritabanından son 100 skor kaydını alır.
  * `data.forEach`: Her oyuncunun farklı sorulardan aldığı puanları tek bir çatı altında toplayarak toplama işlemi yapar.
  * `sort`: Oyuncuları toplam puanlarına göre büyükten küçüğe dizer.
  * `slice(0, 10)`: Sadece en iyi 10 oyuncuyu seçer, sıralama numarası (`rank`) ekleyip telefona gönderir.

---

## 📁 5. `supabase/` Klasörü (Bulut Fonksiyonları)

### 📄 [supabase/functions/submit-sql/index.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/supabase/functions/submit-sql/index.ts)

Oyuncunun yazdığı SQL kodunun doğruluğunu değerlendiren ana yargıçtır.

---

#### 1. SQL Sonucu Karşılaştırma Bloğu (`evaluateAttempt`)
```typescript
function evaluateAttempt(signature: string, rows: Record<string, unknown>[]): ArenaResponse {
  if (signature === 'select-all-goblins') {
    if (rows.length === 4 && rows[0]?.id && rows[0]?.name && rows[0]?.hp && rows[0]?.dungeon) {
      return { success: true, feedback: 'Tüm goblins başarıyla seçildi!', damage: 10, critical: false, xpAwarded: 5 };
    }
  }

  if (signature === 'where-sewer-goblins') {
    if (rows.length === 2 && rows.every(r => r.dungeon === 'Sewer')) {
      return { success: true, feedback: 'Sewer dungeon\'undaki goblins bulundu!', damage: 15, critical: false, xpAwarded: 8 };
    }
  }

  if (signature === 'order-by-hp-asc') {
    if (rows.length === 4 && rows[0].hp === 18) {
      return { success: true, feedback: 'HP artan sıralama doğru!', damage: 18, critical: false, xpAwarded: 9 };
    }
  }
  
  // ... diğer 30'dan fazla sorunun kontrol imzaları ...
```
* **Açıklama:** Oyuncunun yazdığı SQL kodunun veritabanından getirdiği satırları (`rows`) inceler.
  * Her sorunun kendine has bir **doğruluk imzası** (`signature`) vardır.
  * Örneğin, eğer soru tüm goblinleri getirmekse (`select-all-goblins`), gelen veride 4 adet goblin olmasını ve kolonlarının dolu olmasını şart koşar.
  * Sıralama sorusuysa (`order-by-hp-asc`), listenin en başındaki goblinin canının gerçekten en düşük can (18 HP) olup olmadığını denetler. Şartlar uyuyorsa oyuna "Başarılı, canavara hasar verildi" mesajı yollar.

---

#### 2. Deno API Sunucusu Giriş Kapısı (`Deno.serve`)
```typescript
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { challengeId, sql } = await request.json();
    
    // ... güvenlik denetimleri ve daha önce çözüldü mü kontrolü ...

    const { data: rows, error: executeError } = await adminClient.rpc('execute_arena_sql', {
      query_text: sql,
    });
    
    if (executeError) {
      return jsonResponse(failedResponse(executeError.message));
    }
    
    const response = evaluateAttempt(challenge.expected_signature, rows);
    return jsonResponse(response);
  } catch (error) {
    // ...
  }
});
```
* **Açıklama:** Bu bulut fonksiyonunu dış dünyaya açan ana döngüdür.
  * Telefondan gelen SQL kodunu ve soru numarasını okur.
  * **Veritabanında Güvenli Kod Çalıştırma (`execute_arena_sql`)**: Oyuncunun yazdığı sorguyu veritabanında çalıştırır. Eğer SQL kodunda yazım hatası (syntax error) varsa veritabanı hata döner ve bu hata direkt oyuncuya gösterilir.
  * Hata yoksa dönen sonuç listesini alıp yukarıdaki değerlendirme fonksiyonuna (`evaluateAttempt`) yollayarak oyun sonucunu üretir.


