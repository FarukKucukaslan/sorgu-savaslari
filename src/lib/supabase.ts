import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Çevre değişkenlerinden (Environment Variables) Supabase URL ve API Anahtarını alıyoruz.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Eğer bu değişkenler .env dosyasında tanımlı değilse uygulamanın çökmesini sağlayarak uyarı veriyoruz.
if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Supabase environment variables are missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your .env file.'
  );
}

/**
 * Sunucu Tarafı Ön Belleğe Alma (SSR) Uyumlu Depolama Adaptörü (Storage Adapter).
 * 
 * Neden Gerekli?
 * React Native uygulamalarında Supabase oturumunu (session) kalıcı kılmak için AsyncStorage gerekir.
 * Ancak uygulama web modunda derlenirken (SSR aşamasında) Node.js ortamında çalışır ve 'window' nesnesi bulunmaz.
 * Bu adaptör, web ortamında sunucu tarafındaki çökmeleri önlemek için 'window' denetimi yapar
 * ve tarayıcıda ise localStorage'ı, mobilde ise AsyncStorage'ı kullanarak oturumu kalıcı kılar.
 */
const customStorage = {
  // Depolanan anahtarı çeker
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null; // SSR aşamasında null döner (çökmeyi önler)
    }
    return AsyncStorage.getItem(key);
  },
  // Veriyi depolar
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },
  // Depolanan veriyi siler
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

// Supabase istemcisini (client) yukarıdaki özel ayarlar ile oluşturuyoruz.
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: customStorage,         // Oturumu kalıcı kılmak için hazırladığımız özel adaptör
    autoRefreshToken: true,        // Kullanıcının oturum süresi bittiğinde otomatik yeniler
    persistSession: true,          // Oturumu cihaz kapatılsa dahi hafızada saklar
    detectSessionInUrl: false,     // OAuth yönlendirmelerini mobil ortam için devre dışı bırakır
  },
});
