# 🚀 Hızlı Başlangıç Rehberi

## 1️⃣ Konfigürasyon (Bir Kez)

### Adım 1: Environment Dosyalarını Oluştur

**Kök klasörde** `.env` dosyası oluştur:
```bash
EXPO_PUBLIC_SUPABASE_URL=<supabase_url>
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase_key>
EXPO_PUBLIC_API_URL=http://localhost:3001
```

**Backend klasörde** (`backend/.env`) dosyası oluştur:
```bash
SUPABASE_URL=<supabase_url>
SUPABASE_ANON_KEY=<supabase_anon_key>
SUPABASE_SERVICE_KEY=<supabase_service_key>
PORT=3001
NODE_ENV=development
```

### Adım 2: Paketleri Kur
```bash
# Frontend paketleri
npm install

# Backend paketleri
cd backend
npm install
cd ..
```

## 2️⃣ Günlük Geliştirme

### Windows:
```bash
# İki terminal açan script
start-dev.bat
```

### macOS/Linux:
```bash
# Terminal 1
cd backend && npm run start:dev

# Terminal 2
npm run web
```

### Açılacak Adresler:
- **Backend API**: http://localhost:3001
- **Frontend Web**: http://localhost:8081 (web)
- **Expo**: http://localhost:19000 (mobile)

## 3️⃣ Yeni Feature Ekleme

### Backend'e Yeni API Endpoint'i:

1. **Klasör oluştur**: `backend/src/newfeature/`

2. **Service** (`newfeature.service.ts`):
```typescript
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NewFeatureService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getData() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('table_name')
      .select('*');
    
    if (error) throw error;
    return data;
  }
}
```

3. **Controller** (`newfeature.controller.ts`):
```typescript
import { Controller, Get } from '@nestjs/common';
import { NewFeatureService } from './newfeature.service';

@Controller('api/newfeature')
export class NewFeatureController {
  constructor(private readonly service: NewFeatureService) {}

  @Get()
  async getData() {
    return this.service.getData();
  }
}
```

4. **Module** (`newfeature.module.ts`):
```typescript
import { Module } from '@nestjs/common';
import { NewFeatureController } from './newfeature.controller';
import { NewFeatureService } from './newfeature.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [NewFeatureController],
  providers: [NewFeatureService],
})
export class NewFeatureModule {}
```

5. **Module'ü import et** (`app.module.ts`):
```typescript
import { NewFeatureModule } from './newfeature/newfeature.module';

@Module({
  imports: [
    // ... diğer moduller
    NewFeatureModule,
  ],
  // ...
})
export class AppModule {}
```

### Frontend'de API Çağrısı:

1. **API Client'a ekle** (`lib/api-client.ts`):
```typescript
export class NewFeatureApi {
  static async getData() {
    return ApiClient.get('/api/newfeature');
  }
}
```

2. **Component'te kullan**:
```typescript
import { NewFeatureApi } from '@/lib/api-client';

export function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    NewFeatureApi.getData().then(setData);
  }, []);

  return <View>{/* render data */}</View>;
}
```

## 🔍 Debugging

### Backend hataları görmek:
```bash
cd backend
npm run start:dev
# Konsol çıktısını gözlemle
```

### Frontend hataları görmek:
- Web: Tarayıcı DevTools (F12)
- Mobile: Expo app > Debug

### API bağlantısı test etme:
```bash
# Backend API'sini test et
curl http://localhost:3001/api/arena/questions

# Response JSON dönmeli
```

## 📁 Dosya Yapısı

```
sorgu-savaslari/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.config.ts
│   │   ├── supabase/
│   │   │   ├── supabase.service.ts
│   │   │   └── supabase.module.ts
│   │   ├── arena/           ← Ana feature
│   │   │   ├── arena.controller.ts
│   │   │   ├── arena.service.ts
│   │   │   └── arena.module.ts
│   │   ├── app.module.ts    ← Tüm modules buraya import edilir
│   │   └── main.ts          ← Server başlangıç
│   ├── .env
│   └── package.json
│
├── lib/
│   ├── api-client.ts        ← Frontend API çağrıları
│   ├── supabase.ts          ← Eski yapı (gerek duyarsa)
│   └── ...
│
├── app/
│   ├── arena.tsx            ← Arena sayfası (API'yi kullan)
│   └── ...
│
├── .env                      ← Frontend environment
├── DEVELOPMENT.md            ← Detaylı rehber
└── QUICK_START.md            ← Bu dosya
```

## 🆘 Yaygın Sorunlar

| Sorun | Çözüm |
|-------|-------|
| "Cannot GET /api/..." | Backend çalışmıyor mu? `npm run start:dev` kontrol et |
| CORS hatası | Frontend doğru API URL'sini kullanıyor mu? |
| Supabase bağlantı hatası | .env dosyalarında credentials doğru mu? |
| "Module not found" | `npm install` çalıştırıp paketleri yükle |

## 📖 Kaynaklar

- [NestJS Docs](https://docs.nestjs.com/)
- [Expo Docs](https://docs.expo.dev/)
- [Supabase Guide](https://supabase.com/docs)

---

✅ **Hepsi hazır! Geliştirmeye başlayabilirsin!**
