import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Supabase environment variables are missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

export async function pingSupabase() {
  const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
    method: 'GET',
    headers: {
      apikey: supabasePublishableKey,
    },
  });

  return {
    ok: response.ok,
    status: response.status,
  };
}
