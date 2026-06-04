# Sorgu Savaşları - Tüm Proje Detaylı Kod Açıklama Kılavuzu ⚔️

Bu kılavuz, **Sorgu Savaşları (SQL Arena)** projesinin tamamını kapsar. Frontend arayüzünden veritabanı tohum dosyasına, API sunucusundan bulut fonksiyonlarına kadar her bir dosya, içindeki kod blokları ve fonksiyonlar sırasıyla detaylıca açıklanmıştır.

---

## 📁 Bölüm 1: Ortak Yardımcı Araçlar ve Oyun Motoru (`lib/`)

### 📄 [lib/supabase.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/supabase.ts)
Uygulamanın Supabase bulut veritabanına bağlanmasını sağlayan ana telefon hattıdır.

* **1. Kütüphane Yüklemeleri:**
  * `AsyncStorage`: Cihazın kalıcı hafızasına veri kaydetmek için.
  * `createClient`: Supabase bağlantısı kurmak için.
  * `Platform`: Kodun tarayıcıda mı (Web) yoksa mobilde mi çalıştığını anlamak için.
* **2. Adres ve Şifre Denetimi:**
  * `.env` dosyasından okunan `supabaseUrl` ve `supabasePublishableKey` kontrol edilir. Bilgiler yoksa hata fırlatılır.
* **3. `customStorage` (Hafıza Adaptörü):**
  * Kullanıcının giriş oturumunu hatırlar. Web tarayıcısı algılanırsa `localStorage`, mobil cihaz algılanırsa `AsyncStorage` kullanılarak oturum verileri okunur/yazılır/silinir.
* **4. Supabase İstemcisi Başlatma:**
  * Oturumu otomatik yenileyen (`autoRefreshToken: true`) ve kalıcı yapan (`persistSession: true`) `supabase` istemcisi dışa aktarılır.

---

### 📄 [lib/api-client.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/api-client.ts)
NestJS sunucusuyla konuşan postacı sınıfıdır.

* **1. Adres Belirleme:**
  * `API_BASE_URL` değeri ayarlanır (Varsayılan: `http://localhost:3001`).
* **2. `ApiClient.get()` Metodu:**
  * Sunucudan veri talep eden standart GET fonksiyonudur. Dönen cevap başarılı değilse hata verir.
* **3. `ApiClient.post()` Metodu:**
  * Sunucuya yeni veri kaydedilmesi için veri paketi (JSON) yollayan POST fonksiyonudur.
* **4. `ArenaApi` Sınıfı:**
  * Soruları çekme (`getArenaQuestions`), skor kaydetme (`submitScore`), liderlik sıralaması (`getLeaderboard`) gibi NestJS uç noktalarına giden özel kısa yollardır.

---

### 📄 [lib/sql-rpg.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts)
RPG mantığını ve veritabanı sorgularını yürüten **ana oyun motorudur**.

* **1. Veri Yapıları (Types):**
  * `Challenge`, `Module`, `UserProfile`, `Achievement`, `LeaderboardEntry`, `SubmitSqlAttemptResult` gibi oyundaki nesne kalıplarını tanımlar.
* **2. [validateSqlForArena](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L121-L141) (Güvenlik Kontrolü):**
  * Sorgunun boş olmasını, noktalı virgül içermesini (hack engeli) engeller. Yalnızca `SELECT` sorgularına izin verip, veri değiştiren/silen (`DELETE`, `DROP`, `UPDATE` vb.) komutları engeller.
* **3. [getChallenges](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L143-L164) (Soruları Getirme):**
  * Veritabanından soruları sıralı olarak çeker ve temiz bir veri dizisine dönüştürür.
* **4. [submitSqlAttempt](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L166-L217) (Sorgu Gönderme):**
  * Oyuncunun yazdığı sorguyu Supabase bulut fonksiyonuna (`submit-sql`) yollar ve hasar/XP cevabını alır.
* **5. [recordAttemptToDb](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L220-L245) (Deneme Kaydı):**
  * Oyuncunun yaptığı her SQL atağını tarihsel takip için `attempts` tablosuna yazar.
* **6. [getOrCreateUserProfile](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L270-L312) (Profil Oluşturma):**
  * Oyuncu ilk kez girdiğinde otomatik misafir profili oluşturur.
* **7. [updateUserProfileAfterChallenge](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L342-L380) (Profil Güncelleme):**
  * Kazanılan XP'yi ekler, her 500 XP'de oyuncuya seviye atlatır (`Math.floor(1 + newTotalXp / 500)`). Doğru cevaplarda kombo sayısını artırır, yanlışlarda sıfırlar.
* **8. [unlockAchievement](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L415-L434) (Başarım Açma):**
  * Oyuncunun kazandığı başarımı kaydeder ve kazanılan ödül XP'sini döner.
* **9. [updateModuleProgress](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L475-L535) (Modül İlerlemesi):**
  * Modüldeki ilerlemeyi %10 artırır. İlerleme %100 olduğunda modülü tamamlandı olarak işaretler.
* **10. [getDailyChallenge](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L538-L562) (Günlük Görev Çekme):**
  * Tarihe göre o günün özel günlük görevini ve XP çarpanını getirir.
* **11. [getLeaderboard](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L583-L601) (Sıralamayı Getirme):**
  * Toplam XP'ye göre sıralı kullanıcı listesini döner.

---

## 📁 Bölüm 2: Ortak Arayüz Bileşenleri (`components/`)

### 📄 [components/haptic-tab.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/components/haptic-tab.tsx)
* **Titreşim Desteği:**
  * Sadece iOS cihazlarda çalışarak, oyuncu menü tuşuna bastığı an `Haptics.impactAsync()` fonksiyonu ile hafif bir dokunma hissiyatı (`Light`) oluşturur.

### 📄 [components/themed-text.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/components/themed-text.tsx)
* **Akıllı Temalı Yazı:**
  * Telefonun koyu (`dark`) ya da açık (`light`) mod durumunu yakalayarak metin rengini otomatik ayarlar. Gelen `type` bilgisine göre başlık (`title`), kalın (`defaultSemiBold`) veya link görünümü verir.

---

## 📁 Bölüm 3: Uygulama İskeleti ve Yönlendirmeler (`app/`)

### 📄 [app/_layout.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/_layout.tsx)
* **Kök Yerleşim Yapısı:**
  * `useEffect` içinde kullanıcının açık oturumu yoksa otomatik olarak arka planda geçici misafir hesabı oluşturur (`signInAnonymously()`).
  * Aktif renk temasını sarmalar ve alt menü grubunu (`(tabs)`) ekrana yükler.

### 📄 [app/(tabs)/_layout.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/_layout.tsx)
* **Alt Sekme Yönetimi:**
  * Beş adet ana ekranı (Arena, Günlük, Başarılar, Liderlik, Profil) menü butonlarıyla eşleştirir ve onlara simgeler atar. Menü geçişlerinde titreşim özelliğini aktif eder.

---

## 📁 Bölüm 4: Oyun Sayfaları (`app/(tabs)/`)

### 📄 [app/(tabs)/index.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/index.tsx) (SQL Arena Ekranı)
* Canavarlarla savaşılan ana ekrandır.
* **Soru & Modül Filtreleme:** Seçili modüldeki daha önce çözülmemiş soruları listeler, çözülenleri göstermez.
* **Sorgu Teslimi (`handleSubmit`):** Yazılan kodu güvenlik testinden geçirir, API'ye gönderir. Doğruysa canavara verilen hasarı ve kazanılan XP'yi ekranda gösterip 2 saniye sonra sonraki soruya geçer. Profil istatistiklerine göre başarım kazanılıp kazanılmadığını kontrol eder.

### 📄 [app/(tabs)/daily-challenge.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/daily-challenge.tsx) (Günlük Görev)
* Günde sadece 1 kez girilebilen, yüksek puan çarpanlı soru ekranıdır.
* **Kontrol Mantığı:** Oyuncu bugün daha önce denediyse girişi engeller ve eski sonucu gösterir. Doğru sorgu yazıldığında XP ve hasar çarpanla (`multiplier`, örn: 1.5x) çarpılarak verilir.

### 📄 [app/(tabs)/achievements.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/achievements.tsx) (Başarılar Ekranı)
* Oyundaki tüm başarımları listeler.
* Açılan başarımlar kendi ikonuyla renkli, kilitli başarımlar ise asma kilit simgesiyle (`🔒`) ve yarı şeffaf (`opacity: 0.6`) olarak gösterilir.

### 📄 [app/(tabs)/leaderboard.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/leaderboard.tsx) (Liderlik Tablosu)
* En yüksek tecrübeye sahip oyuncuları sıralar.
* İlk üç oyuncunun yanına madalya simgeleri (`🥇`, `🥈`, `🥉`) yerleştirilir. Kendi satırımızın arka planını yeşil yaparak kendimizi ayırt etmemizi sağlar.

### 📄 [app/(tabs)/profile.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/profile.tsx) (Oyuncu Profili)
* Oyuncunun karakter bilgilerini gösterir.
* **Seviye İlerleme Çubuğu:** Bir sonraki seviyeye ne kadar XP kaldığını yüzde bazlı (`progressPercent`) hesaplar ve görsel bir ilerleme çubuğu üzerinde çizer.
* Toplam hasar, kritik vuruşlar, başarı oranları ve kombo rekorları gibi istatistik kartlarını listeler.

---

## 📁 Bölüm 5: NestJS API Sunucusu (`backend/`)

### 📄 [backend/src/config/supabase.config.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/backend/src/config/supabase.config.ts)
* Backend sunucusunun Supabase bulut veritabanına admin/service yetkileriyle bağlanmasını sağlar. `SUPABASE_URL` ve `SUPABASE_SERVICE_KEY` ortam değişkenlerini kontrol eder.

### 📄 [backend/src/supabase/supabase.service.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/backend/src/supabase/supabase.service.ts)
* Backend sunucusunda Supabase tablolarına doğrudan sorgu atan ara katman servisidir. Arena sorularını getirme (`getArenaQuestions`), skor çekme (`getUserScores`) ve yeni skor kaydetme (`saveScore`) fonksiyonlarını barındırır.

### 📄 [backend/src/arena/arena.controller.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/backend/src/arena/arena.controller.ts)
* Mobil uygulamadan gelen HTTP isteklerini yönlendirir. `/api/arena/questions` adresinden soruları teslim eder, `/submit-score` ile gelen skorları kontrol edip kaydeder ve `/leaderboard` adresiyle sıralamayı yollar.

### 📄 [backend/src/arena/arena.service.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/backend/src/arena/arena.service.ts)
* **Skor & Hızlı Cevap Bonusu:** Cevap doğruysa 10 puan ekler. Oyuncu soruyu 30 saniyenin altında çözdüyse fazladan 5 puan hızlı cevap bonusu yazar.
* **Sıralama Hesaplama:** Veritabanından gelen son 100 skor kaydını alır, oyunculara göre gruplayıp toplar, büyükten küçüğe dizer ve en iyi 10 oyuncuyu döner.

---

## 📁 Bölüm 6: Supabase Edge Functions (`supabase/`)

### 📄 [supabase/functions/submit-sql/index.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/supabase/functions/submit-sql/index.ts)
* Oyuncunun yazdığı SQL kodunun sonucunu değerlendiren güvenli ve sunucusuz (Serverless) çalışan koddur.
* **rpc('execute_arena_sql'):** Gelen SQL kodunu veritabanı üzerinde çalıştırır. Kodda yazım hatası varsa bunu yakalayıp kullanıcıya döner.
* **`evaluateAttempt()`:** Dönen satır sayısını ve kolon içeriklerini sorunun beklenen imzasıyla (`expected_signature`) test eder. Örneğin `order-by-hp-asc` imzasında gelen ilk canavarın HP değerinin gerçekten en düşük (18 HP) olup olmadığını denetler. Sonuç doğruysa hasar ve XP tutarını telefona döner.

---

## 📁 Bölüm 7: Veritabanı Tohum Scripti (`scripts/`)

### 📄 [scripts/sql-rpg-supabase.sql](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/scripts/sql-rpg-supabase.sql)
* Veritabanının tüm tablo şemalarını ve ilk başlangıç verilerini kuran SQL dosyasıdır.
* `challenges`, `goblins`, `user_profiles`, `attempts`, `modules`, `achievements`, `user_module_progress` ve `daily_challenges` tablolarını kurar.
* Güvenli SQL çalıştırmak için veritabanı düzeyindeki `execute_arena_sql` fonksiyonunu tanımlar.
