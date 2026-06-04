# Sorgu Savaşları - Detaylı ve Kapsamlı Kod Açıklama Rehberi ⚔️

Bu rehber, **Sorgu Savaşları (SQL Arena)** projesindeki veritabanı tablolarından mobil arayüz ekranlarına, RPG oyun motorundan backend uç noktalarına kadar tüm kod yapısını ve aralarındaki etkileşimi tek tek detaylandırarak açıklar.

---

## 📁 1. Veritabanı Katmanı (Database Schema)

Uygulamanın can damarı olan veritabanı şeması, PostgreSQL tabanlı Supabase üzerinde koşar. Kurulum ve tohum verileri [sql-rpg-supabase.sql](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/scripts/sql-rpg-supabase.sql) dosyasında tanımlıdır.

### Ana Tablolar ve Görevleri:
* **`challenges` (Sorular):** Oyundaki SQL sorularını barındırır. Her sorunun zorluk derecesi, ipucu (`hint`), ait olduğu modül (`module_id`) ve doğru olup olmadığını doğrulayan bir imza verisi (`expected_signature`) bulunur.
* **`goblins` (Canavarlar):** Arena içinde savaşılan düşmanların can miktarları (`hp`) ve bulundukları zindanlar (`dungeon`) gibi bilgileri saklar.
* **`user_profiles` (Oyuncu Profilleri):** Oyuncuların seviye (`level`), toplam tecrübe puanı (`total_xp`), toplam canavara verilen hasar (`total_damage`), kombo durumları ve unvanları gibi RPG verilerini tutar.
* **`attempts` (Sorgu Denemeleri):** Oyuncuların Arena ekranında gönderdiği tüm SELECT sorgularını, başarılı olup olmadıklarını ve verdikleri hasarları tarihsel olarak kaydeder.
* **`modules` (Eğitim Modülleri):** SQL konularını (SELECT, WHERE, ORDER BY, GROUP BY vb.) mantıksal bölümlere ayırır.
* **`user_module_progress` (Modül İlerlemeleri):** Oyuncunun hangi modülde % kaç ilerlediğini ve modülü bitirip bitirmediğini saklar.
* **`achievements` (Başarımlar) & `user_achievements` (Oyuncu Başarımları):** Sistemdeki tüm başarımları (örneğin "İlk Kritik Vuruş", "10'lu Kombo") ve oyuncuların kazandığı başarımları eşleştirir.
* **`daily_challenges` (Günlük Görevler) & `user_daily_attempts` (Günlük Denemeler):** Her güne özel belirlenen bonus XP çarpanına sahip görevleri ve oyuncunun o günkü tek deneme hakkını saklar.
* **`user_scores` (Backend Skorları) & `arena_questions`:** NestJS backend sunucusu üzerinden liderlik tablosu puanlarını hesaplamak için kullanılan alternatif skorlama tablolarıdır.

---

## 📁 2. Ortak Yardımcı Araçlar ve Oyun Motoru (`lib/`)

Uygulamanın veri alışverişi ve temel kuralları bu klasör altındaki yardımcı dosyalarla yönetilir.

### 📄 [lib/supabase.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/supabase.ts)
Supabase bulut servislerine güvenli bir şekilde bağlanmamızı sağlayan ana kapıdır.
* **`customStorage`:** Oyuncunun giriş oturumunu (Session) kaydeder. Eğer uygulama web tarayıcısında çalışıyorsa `localStorage`, cep telefonunda çalışıyorsa `@react-native-async-storage/async-storage` kullanarak bilgileri kalıcı hafızada saklar.
* **`supabase`:** Adres (`EXPO_PUBLIC_SUPABASE_URL`) ve şifre (`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) parametreleriyle oluşturulan, oturumu otomatik yenileyen (`autoRefreshToken: true`) resmi Supabase istemcisidir.

### 📄 [lib/api-client.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/api-client.ts)
Uygulamanın NestJS API sunucusuna HTTP GET ve POST istekleri atmasını sağlayan istemci sınıfıdır.
* **`ApiClient.get()` & `ApiClient.post()`:** Gelen istekleri `API_BASE_URL` (varsayılan: `http://localhost:3001`) adresiyle birleştirerek sunucuya yollar ve hata yönetimini gerçekleştirir.
* **`ArenaApi`:** NestJS sunucusundaki `/api/arena/questions`, `/api/arena/submit-score` ve `/api/arena/leaderboard` gibi endpoint'leri çağıran kolaylaştırıcı fonksiyon gruplarıdır.

### 📄 [lib/sql-rpg.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts)
Tüm RPG kurallarını, veri tipi şablonlarını (TypeScript Types) ve Supabase veritabanı sorgularını barındıran **ana oyun motorudur**.
* **[validateSqlForArena](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L121-L141):** Güvenlik kontrol mekanizmasıdır. Yazılan kodda noktalı virgül (`;`) bulunmasını yasaklar, yalnızca `SELECT` ile başlayan sorgulara izin verir ve veritabanını bozabilecek yazma/silme (`DELETE`, `DROP`, `UPDATE` vb.) komutlarını engeller.
* **[getChallenges](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L143-L164):** Veritabanındaki `challenges` tablosundan soruları sırasıyla getirir.
* **[submitSqlAttempt](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L166-L217):** Oyuncunun SQL kodunu Supabase Edge Function (`submit-sql`) bulut koduna gönderir ve hasar/XP sonucunu alır.
* **[recordAttemptToDb](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L220-L245):** Oyuncunun yaptığı denemeyi `attempts` tablosuna başarı/hasar bilgileriyle kaydeder.
* **[getOrCreateUserProfile](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L270-L312):** Oyuncu için veritabanında profil olup olmadığına bakar; yoksa benzersiz bir kullanıcı adı üreterek yeni bir oyuncu profili oluşturur.
* **[updateUserProfileAfterChallenge](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L342-L380):** Oyuncu her doğru veya yanlış yaptığında tecrübe puanını (XP) günceller. Her 500 XP'de bir oyuncuya seviye atlatır (`Math.floor(1 + newTotalXp / 500)`). Doğru cevaplarda kombo sayısını artırır, yanlışlarda sıfırlar.
* **[unlockAchievement](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L415-L434):** Oyuncunun kazandığı başarımları `user_achievements` tablosuna kaydeder ve kazanılan ödül XP'sini döner.
* **[updateModuleProgress](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L475-L535):** Oyuncunun modüldeki ilerlemesini günceller. İlerleme %100 olduğunda modülü tamamlandı olarak işaretler.
* **[getDailyChallenge](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L538-L562):** Sunucu saatine göre o gün aktif olan günlük görevi ve XP çarpanını getirir.
* **[getLeaderboard](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L583-L601):** Oyuncuları toplam XP'lerine göre sıralayarak liderlik tablosunu çeker.

---

## 📁 3. Mobil Uygulama Ekranları (`app/`)

Expo Router tabanlı dosya yönlendirmesiyle çalışan bu ekranlar, kullanıcının doğrudan etkileşime girdiği görsel katmanlardır.

### 📄 [app/_layout.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/_layout.tsx)
Uygulama ilk açıldığında yüklenen kök dosyadır.
* **Anonim Giriş Kontrolü:** `useEffect` bloğu içinde, eğer kullanıcının cihazında kayıtlı bir oturum yoksa arka planda sessizce misafir hesabı oluşturur (`signInAnonymously()`). Böylece kullanıcı doğrudan oyuna başlayabilir.
* **Tema Sarmalayıcı:** Koyu (`dark`) veya varsayılan (`light`) temaya göre tüm sayfaları sarmalar.

### 📄 [app/(tabs)/_layout.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/_layout.tsx)
Alt taraftaki yönlendirme menüsünü (Tab Bar) yapılandırır. Menü tuşlarına tıklandığında [HapticTab](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/components/haptic-tab.tsx) bileşeni aracılığıyla hafif bir titreşim etkisi verir. Ekranlar şunlardır:
1. **Arena** (`index`) - SQL yazarak canavarlarla dövüşme.
2. **Günlük** (`daily-challenge`) - Günün özel bonuslu sorusu.
3. **Başarılar** (`achievements`) - Kilitli ve açık başarımlar listesi.
4. **Liderlik** (`leaderboard`) - En iyi oyuncular sıralaması.
5. **Profil** (`profile`) - Karakter istatistikleri ve unvanlar.

### 📄 [app/(tabs)/index.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/index.tsx) (SQL Arena Ekranı)
Oyuncunun SQL yazarak canavarlarla dövüştüğü ana oyun merkezidir.
* **`loadModules()` & `loadChallenges()`:** Seçili modüle ait çözülmemiş soruları getirir. Daha önce çözülen sorular otomatik filtrelenerek listeden gizlenir.
* **`handleSubmit()`:** Sorgu gönderildiğinde girdiyi denetler, bulut sunucusuna gönderir ve dönen hasar bilgisini ekrana yansıtır.
* Oyuncunun kazandığı puanlarla başarım kazanıp kazanmadığını kontrol eder. Örneğin 3'lü komboya ulaştığında veya toplam hasarı 1000'i geçtiğinde arka arkaya başarımların kilidini açar ([unlockAchievement](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/lib/sql-rpg.ts#L415-L434)).
* Doğru cevap verildiğinde 2 saniye sonra otomatik olarak sonraki soruya geçer.

### 📄 [app/(tabs)/daily-challenge.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/daily-challenge.tsx) (Günlük Görev)
Günde sadece 1 kez girilebilen, yüksek XP ödüllü özel görev ekranıdır.
* **Tek Katılım Hakkı:** Kullanıcı soruyu daha önce denediyse `user_daily_attempts` tablosu kontrol edilir ve giriş engellenerek daha önceki deneme sonucu gösterilir.
* **Çarpan Ödülü:** Başarılı olunduğunda kazanılan hasar ve XP, o güne özel çarpanla (`multiplier`, örn: 1.5x) çarpılarak oyuncuya yansıtılır.

### 📄 [app/(tabs)/achievements.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/achievements.tsx) (Başarımlar Ekranı)
Oyundaki tüm başarımları listeleyen ekrandır.
* Oyuncunun hangi başarımları açtığını yeşil ikonlarla ve detaylarıyla gösterir.
* Henüz açılmamış başarımlar ise asma kilit (`🔒`) simgesiyle yarı şeffaf (`opacity: 0.6`) olarak gösterilir.
* Tepede kazanılan toplam başarı XP'si ve ilerleme çubuğu yer alır.

### 📄 [app/(tabs)/leaderboard.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/leaderboard.tsx) (Liderlik Tablosu)
Oyuncuların toplam XP'lerine göre sıralandığı rekabet ekranıdır.
* **Derece Rozetleri:** İlk üç oyuncuya sırasıyla 🥇, 🥈, 🥉 madalyaları verilir.
* **Kendi Profilini Vurgulama:** Giriş yapan oyuncunun kendi satırı listede yeşil çerçeve ve arka planla belirginleştirilir.
* Her kullanıcının başarı yüzdesi ve toplam deneme sayısı gösterilir.

### 📄 [app/(tabs)/profile.tsx](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/app/%28tabs%29/profile.tsx) (Karakter Profili)
Oyuncunun kendi RPG karakter gelişimini takip ettiği istatistik merkezidir.
* **Level İlerlemesi:** Bir sonraki seviyeye geçmek için gereken XP durumunu görsel bir bar yardımıyla yüzde bazlı gösterir (`progressPercent`).
* **İstatistik Kartları:** Toplam hasar, toplam XP, başarı oranı (doğru/yanlış oranı), toplam kritik vuruş sayısı, anlık kombo ve rekor kombo bilgileri grid yapısında listelenir.

---

## 📁 4. NestJS API Sunucusu (`backend/`)

Uygulamanın liderlik tablosu puanlamalarını ve skor geçmişini yönettiği NodeJS tabanlı arka yüz sunucusudur.

### 📄 [backend/src/arena/arena.controller.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/backend/src/arena/arena.controller.ts)
Mobil uygulamadan gelen HTTP isteklerini yönlendiren uç noktalardır.
* `GET /api/arena/questions`: Tüm arena sorularını getirir.
* `POST /api/arena/submit-score`: Oyuncunun skorunu kaydeder.
* `GET /api/arena/leaderboard`: En yüksek puanlı ilk 10 oyuncuyu döner.

### 📄 [backend/src/arena/arena.service.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/backend/src/arena/arena.service.ts)
* **Skorlama & Hızlı Cevap Bonusu:** `submitScore` metodunda oyuncunun cevabı doğruysa 10 puan eklenir. Eğer oyuncu soruyu 30 saniyenin altında çözdüyse (`timeSpent < 30`) fazladan 5 puan hızlı cevap bonusu verilir.
* **Liderlik Hesaplama:** `getLeaderboard` metodu, `user_scores` tablosundaki son 100 skor kaydını çeker, bunları oyuncu bazında toplar, büyükten küçüğe sıralar ve ilk 10 oyuncuyu sıralama numarası (`rank`) vererek döndürür.

---

## 📁 5. Supabase Edge Functions (`supabase/`)

Oyuncunun yazdığı SQL kodunun gerçekten doğru olup olmadığını kontrol eden, tamamen sunucusuz (Serverless) ve güvenli çalışan bulut fonksiyonları katmanıdır.

### 📄 [supabase/functions/submit-sql/index.ts](file:///c:/Users/MONSTER/MobilUygulamalar/sorgu-savaslari/supabase/functions/submit-sql/index.ts)
Deno çalışma zamanı (runtime) üzerinde koşan bu fonksiyon SQL doğruluğunu şu aşamalarla değerlendirir:
1. **Lokal Veritabanında Çalıştırma (`execute_arena_sql`):** Oyuncunun gönderdiği SQL sorgusunu veritabanı üzerinde çalıştırır. Eğer sorguda yazım hatası varsa oluşan hatayı yakalayıp doğrudan mobil uygulamaya döner.
2. **Değerlendirme Modülü (`evaluateAttempt`):** Dönen satırları (`rows`) sorunun doğruluk imzasına (`expected_signature`) göre karşılaştırır.
   * *Örnek (Sorgu: `select-all-goblins`):* Dönen veri satır sayısının 4 olup olmadığını ve `id`, `name`, `hp`, `dungeon` kolonlarının dolu gelip gelmediğini kontrol eder.
   * *Örnek (Sorgu: `order-by-hp-asc`):* Dönen 4 satırdan ilk satırdaki goblinin HP değerinin en düşük can olan 18 olup olmadığını doğrular.
3. Şartlar sağlanıyorsa başarılı yanıt döner, canavara verilecek hasarı ve kazanılan XP değerini hesaplar.
