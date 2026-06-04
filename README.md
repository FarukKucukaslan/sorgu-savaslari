# ⚔️ Sorgu Savaşları - SQL RPG Oyunu ⚔️

Sorgu Savaşları, SQL (Structured Query Language) sorgularını oyunlaştırarak öğretmeyi amaçlayan, mobil (React Native/Expo) ve sunucu (NestJS + Supabase) teknolojilerini bir araya getiren yenilikçi bir SQL-RPG (Rol Yapma Oyunu) projesidir.

Bu proje iki farklı ders kapsamında sunulmak üzere geliştirilmiştir:
1. **Mobil Uygulama Geliştirme**: Expo/React Native tabanlı mobil arayüz.
2. **Veri Tabanı Sistemleri**: Supabase veri tabanı şeması ve NestJS backend API sunucusu.

---

## 🚀 Proje Mimarisi ve Teknolojiler

Projemiz üç ana katmandan oluşmaktadır:
- **Frontend (Mobil Uygulama)**: [Expo](https://expo.dev) ve **React Native** (TypeScript) kullanılarak geliştirilmiştir. Dosya tabanlı yönlendirme (`expo-router`) kullanır.
- **Backend (API Sunucusu)**: **NestJS** (TypeScript) framework'ü kullanılarak modüler yapıda geliştirilmiştir.
- **Database & Cloud Services**: **Supabase** (PostgreSQL) veri tabanı, Row Level Security (RLS) güvenlik politikaları ve Deno tabanlı **Supabase Edge Functions** (Sorgu doğrulama servisleri).

---

## 📁 Proje Klasör Yapısı

```
sorgu-savaslari/
├── src/                # Mobil Uygulama Kaynak Kodları
│   ├── components/     # Ortak UI/Tema Bileşenleri (Butonlar, Metinler vb.)
│   ├── constants/      # Renk ve Stil Temaları, Cevap Anahtarları
│   ├── hooks/          # Tema ve Renk Şeması Kontrol Kancaları
│   └── lib/            # Supabase Bağlantısı ve Oyun Mantığı (sql-rpg.ts)
├── app/                # Expo Router Sayfaları (Arayüz Ekranları)
│   ├── (tabs)/         # Alt Menü Sekmeleri
│   │   ├── index.tsx   # Arena Sayfası (SQL Sorgu Savaşı Ekranı)
│   │   ├── daily-challenge.tsx # Günlük Ödüllü Soru Ekranı
│   │   ├── achievements.tsx    # Başarılar / Madalyalar Ekranı
│   │   ├── leaderboard.tsx     # Liderlik Tablosu
│   │   └── profile.tsx         # Oyuncu Profili ve İstatistikleri
│   └── _layout.tsx     # Ana Uygulama Düzeni ve Anonim Giriş Yönetimi
├── backend/            # NestJS Backend API Sunucusu (Veri Tabanı Dersi İçin)
│   ├── src/
│   │   ├── arena/      # Arena Endpoint'leri, Skor Kayıt ve Kontrol Servisleri
│   │   └── supabase/   # Supabase Bağlantı Servisi
│   └── .env            # Backend Gizli Değişkenleri
├── supabase/           # Veri Tabanı Göçleri ve Edge Functions Kodları
└── scripts/            # Veri Tabanı Kurulum ve Tohumlama Betiği (SQL)
```

---

## 🛠️ Kurulum ve Çalıştırma Adımları

### 1️⃣ Ön Gereksinimler
Bilgisayarınızda **Node.js (v18+)** ve **Git** kurulu olmalıdır. Mobil cihazda test etmek için **Expo Go** uygulamasını indirebilir veya emülatör kullanabilirsiniz.

### 2️⃣ Ortam Değişkenleri (.env) Yapılandırması
1. **Kök klasörde** `.env` dosyası oluşturun ve şu değerleri girin:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://ypoqoyaiuguqoccpsbxz.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_zwfTqNX00yMdPZGRDXeu4A_I_KAi-jY
   EXPO_PUBLIC_API_URL=http://localhost:3001
   ```

2. **`backend/` klasöründe** `backend/.env` dosyası oluşturun:
   ```env
   SUPABASE_URL=https://ypoqoyaiuguqoccpsbxz.supabase.co
   SUPABASE_ANON_KEY=sb_publishable_zwfTqNX00yMdPZGRDXeu4A_I_KAi-jY
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   PORT=3001
   NODE_ENV=development
   ```

### 3️⃣ Bağımlılıkların Yüklenmesi
Terminalde proje ana dizininde şu komutları sırasıyla çalıştırın:
```bash
# Frontend paketlerini kur
npm install

# Backend paketlerini kur
cd backend
npm install
cd ..
```

### 4️⃣ Veri Tabanının Hazırlanması (Supabase)
Supabase SQL Editor kısmında `scripts/sql-rpg-supabase.sql` dosyasındaki tüm kodları çalıştırın. Bu işlem:
- Challenge, Goblin, Attempts, User Profiles, Achievements vb. tüm gerekli tabloları oluşturur.
- RLS güvenlik kurallarını ve politikalarını tanımlar.
- Geliştirme ve test sorularını veri tabanına otomatik olarak tohumlar (seed).

---

## 🎮 Uygulamayı Başlatma

### Windows (Önerilen - Tek Tıkla Başlatma)
Kök dizinde bulunan aşağıdaki dosyayı çalıştırarak hem Backend'i hem de Frontend'i eşzamanlı başlatabilirsiniz:
```bash
start-dev.bat
```

### Manuel Çalıştırma
İki ayrı terminal penceresi açın:

- **Terminal 1 (Backend - NestJS)**:
  ```bash
  cd backend
  npm run start:dev
  ```
  *API Sunucusu http://localhost:3001 adresinde çalışacaktır.*

- **Terminal 2 (Frontend - Expo)**:
  ```bash
  # Mobil Emülatör veya Expo Go için:
  npm run android
  # veya web tarayıcısında test etmek için:
  npm run web
  ```

---

## 🌟 Temel Oyun Özellikleri

- **SQL Arena (Savaş Alanı)**: Karakterlere hasar vermek için `SELECT` sorgularını doğru yazmanız gerekir.
- **Sonsuz XP Koruması**: Çözülen sorular tekrar çözüldüğünde XP vermez, böylece adil bir oyun ortamı sağlanır.
- **Günlük Soru (Daily Challenge)**: Her gün yenilenen ödüllü SQL sorusu (günde tek katılım hakkı).
- **Başarılar Sistemi**: Belirli hasar barajlarını aşma, kombo yapma gibi kriterlerle açılan madalyalar.
- **Liderlik Tablosu**: Oyuncuların toplam XP'ye göre sıralandığı ve kendi profilinizin yeşil renkle vurgulandığı sıralama ekranı.
- **Profil ve İstatistikler**: Detaylı deneme sayısı, başarı oranı ve kombo takibi.
