# Sorgu Savaşları - NestJS Backend + Expo Frontend Geliştirme Rehberi

## 📦 Proje Yapısı

```
sorgu-savaslari/
├── backend/           # NestJS Backend (API Server)
├── lib/               # Frontend shared libraries
├── app/               # Expo App (React Native)
├── components/        # UI Components
├── constants/         # Application constants
├── scripts/           # Utility scripts
└── package.json       # Root package (Frontend)
```

## 🚀 Kurulum

### 1. Ön Koşullar
- Node.js 18+ veya daha yeni
- npm veya yarn
- Android Studio veya Xcode (mobil test için opsiyonel)

### 2. Supabase Ortam Değişkenleri Ayarla

Kök klasörde `.env` dosyası oluştur:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
EXPO_PUBLIC_API_URL=http://localhost:3001
```

Backend klasörde `backend/.env` dosyası oluştur:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
PORT=3001
NODE_ENV=development
```

### 3. Paketleri Kur

**Frontend (Kök Klasör):**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
cd ..
```

## 🎯 Geliştirme Başlatma

### İki Farklı Terminal Aç:

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```
Backend `http://localhost:3001` adresinde çalışacak

**Terminal 2 - Frontend:**
```bash
npm run web
# Mobil için:
npm run ios    # iOS emülatörü
npm run android # Android emülatörü
```

## 📱 Frontend (Expo App)

### Mevcut Ekranlar:
- `/` - Tab Navigasyonu
- `/arena` - Sorgu Savaşları
- `/leaderboard` - Liderlik Tablosu
- `/profile` - Kullanıcı Profili
- Ve diğerleri...

### Frontend API Kullanımı:

```typescript
import { ArenaApi } from '@/lib/api-client';

// Soruları getir
const questions = await ArenaApi.getArenaQuestions();

// Skoru kaydet
const result = await ArenaApi.submitScore(
  userId,
  questionId,
  isCorrect,
  timeSpent
);

// Leaderboard'u getir
const leaderboard = await ArenaApi.getLeaderboard();
```

## 🔧 Backend (NestJS)

### Mevcut Endpoints:

#### Arena
- `GET /api/arena/questions` - Tüm soruları getir
- `GET /api/arena/questions/:id` - Spesifik soruyu getir
- `POST /api/arena/submit-score` - Skoru kaydet
- `GET /api/arena/leaderboard` - Leaderboard'u getir
- `GET /api/arena/leaderboard/:userId` - Kullanıcı skorunu getir

### Backend Dosya Yapısı:
```
backend/src/
├── main.ts                  # Uygulama giriş noktası
├── app.module.ts            # Root module
├── config/
│   └── supabase.config.ts   # Supabase konfigürasyonu
├── supabase/
│   ├── supabase.service.ts
│   └── supabase.module.ts
├── arena/
│   ├── arena.controller.ts
│   ├── arena.service.ts
│   └── arena.module.ts
└── ...
```

### Backend'e Yeni Feature Ekleme:

1. **Yeni Controller Oluştur** (ör. `skills.controller.ts`)
2. **Service Oluştur** (ör. `skills.service.ts`)
3. **Module Oluştur** (ör. `skills.module.ts`)
4. `AppModule`'e `imports` et

Örnek:
```typescript
// skills.controller.ts
import { Controller, Get } from '@nestjs/common';
import { SkillsService } from './skills.service';

@Controller('api/skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  async getSkills() {
    return this.skillsService.getAllSkills();
  }
}
```

## 📊 Supabase Tablolar

Backend aşağıdaki tabloları kullanır:
- `arena_questions` - Arena soruları
- `user_scores` - Kullanıcı skorları
- Diğer tablolar (auth, profiles, vb.)

## 🔐 Güvenlik Notları

### Geliştirmede:
- CORS: `*` (tüm originlere açık)
- Service Key: Backend'de kullanılıyor

### Production'da:
- CORS: Spesifik domain'lere kısıtla
- Environment değişkenlerini `.env` dosyasına sakla
- Supabase kurallarını ayarla

## 🐛 Sorun Çözme

### Backend başlamıyor?
```bash
cd backend
npm run build
npm start
```

### Frontend Supabase'e bağlanamıyor?
- `.env` dosyasında `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` kontrol et

### Backend API'sine bağlanamıyor?
- Backend çalışıyor mu? `npm run start:dev` kontrol et
- Firewall port 3001'i engellemiyor mu?
- `.env`'de `EXPO_PUBLIC_API_URL` doğru mu?

## 📚 Öğrenme Kaynakları

- [NestJS Dokumentasyonu](https://docs.nestjs.com)
- [Expo Dokumentasyonu](https://docs.expo.dev)
- [Supabase Dokumentasyonu](https://supabase.com/docs)
- [TypeScript Dokumentasyonu](https://www.typescriptlang.org/docs)

## 📝 Sonraki Adımlar

1. [ ] Daily Challenge modülü ekle
2. [ ] Module Learning sistemini ekle
3. [ ] User authentication flow'unu tamamla
4. [ ] Real-time leaderboard updates (WebSocket)
5. [ ] Achievements sistemi
6. [ ] Social features (arkadaş ekleme, vb.)

## 🤝 İşbirliği

Yeni feature eklerken:
1. Feature branch'i oluştur
2. Backend endpoint'i ekle
3. Frontend client'ı ekle
4. Test et
5. Merge et

---

**Son Güncelleme:** May 30, 2026
