import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

// Expo Router'ın başlangıç (anchor) ekranını (tabs) alt dizini olarak ayarlıyoruz.
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  // Cihazın koyu tema (dark mode) veya açık tema (light mode) ayarını alıyoruz.
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Uygulama ilk açıldığında çalışacak olan otomatik üye girişi (Authentication) mantığı.
    // Kullanıcıya giriş ekranı sormadan, test ve hızlı katılım için anonim oturum başlatır.
    const initAuth = async () => {
      try {
        // Cihazın hafızasında daha önce açılmış aktif bir oturum (kullanıcı) var mı diye kontrol eder.
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Eğer oturum yoksa, Supabase üzerinde geçici anonim bir oturum oluşturur.
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

  return (
    // Uygulamanın genel tema sağlayıcısını (DarkTheme veya DefaultTheme) ayarlıyoruz.
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Alt menü sekmelerini barındıran (tabs) klasörünü ana yönlendirici olarak kaydediyoruz */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      {/* Cihazın üst bar (saat, pil durumu vs.) stilini otomatik ayarlar */}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
