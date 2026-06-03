import { createClient } from 'npm:@supabase/supabase-js@2';

type ArenaResponse = {
  success: boolean;
  feedback: string;
  damage: number;
  critical: boolean;
  xpAwarded: number;
  alreadySolved?: boolean;
};

type ChallengeRow = {
  id: number;
  expected_signature: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function failedResponse(feedback: string): ArenaResponse {
  return {
    success: false,
    feedback,
    damage: 0,
    critical: false,
    xpAwarded: 0,
  };
}

function validateSql(sql: string): string | null {
  const trimmed = sql.trim();

  if (!trimmed) return 'Sorgu bos olamaz.';
  if (trimmed.includes(';')) return 'Guvenlik icin noktali virgul yasak.';
  if (!/^select\b/i.test(trimmed)) return 'Sadece SELECT sorgularina izin verilir.';
  if (/\b(insert|update|delete|drop|alter|create|grant|revoke|truncate)\b/i.test(trimmed)) {
    return 'Yazma veya DDL komutlari yasak.';
  }

  return null;
}

function getNumericValue(row: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const matchedKey = Object.keys(row).find((item) => item.toLowerCase() === key.toLowerCase());
    if (!matchedKey) continue;

    const value = row[matchedKey];
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return null;
}

function getTextValue(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const matchedKey = Object.keys(row).find((item) => item.toLowerCase() === key.toLowerCase());
    if (!matchedKey) continue;

    const value = row[matchedKey];
    if (typeof value === 'string') return value;
    if (value !== null && value !== undefined) return String(value);
  }

  return null;
}

function evaluateAttempt(signature: string, rows: Record<string, unknown>[]): ArenaResponse {
  // DEBUG: Log incoming data
  if (signature === 'select-all-goblins') {
    const len = rows.length;
    const row0 = JSON.stringify(rows[0] || {});
    const checks = {
      lenCheck: len === 4,
      id: !!rows[0]?.id,
      name: !!rows[0]?.name,
      hp: !!rows[0]?.hp,
      dungeon: !!rows[0]?.dungeon,
    };
    
    if (len === 4 && rows[0]?.id && rows[0]?.name && rows[0]?.hp && rows[0]?.dungeon) {
      return { success: true, feedback: 'Tüm goblins başarıyla seçildi!', damage: 10, critical: false, xpAwarded: 5 };
    } else {
      return failedResponse(`DEBUG select-all-goblins: len=${len}, checks=${JSON.stringify(checks)}, row0=${row0.substring(0, 150)}`);
    }
  }

  if (signature === 'select-all-names') {
    if (rows.length === 4 && rows.every(r => r.name && !r.hp)) {
      return { success: true, feedback: 'Tüm isimleri başarıyla seçtin!', damage: 10, critical: false, xpAwarded: 5 };
    }
  }

  if (signature === 'select-all-hp') {
    if (rows.length === 4 && rows.every(r => r.hp && !r.name)) {
      return { success: true, feedback: 'Tüm HP değerlerini seçtin!', damage: 10, critical: false, xpAwarded: 5 };
    }
  }

  if (signature === 'select-all-dungeons') {
    if (rows.length === 4 && rows.every(r => r.dungeon)) {
      return { success: true, feedback: 'Tüm dungeon\'ları seçtin!', damage: 10, critical: false, xpAwarded: 5 };
    }
  }

  if (signature === 'select-first-goblin') {
    if (rows.length === 1 && rows[0].name && rows[0].hp && rows[0].dungeon) {
      return { success: true, feedback: 'İlk goblin\'i seçtin!', damage: 10, critical: false, xpAwarded: 5 };
    }
  }

  if (signature === 'select-id-names') {
    if (rows.length === 4 && rows.every(r => r.id && r.name && !r.hp)) {
      return { success: true, feedback: 'ID ve isim başarıyla seçildi!', damage: 12, critical: false, xpAwarded: 6 };
    }
  }

  if (signature === 'select-names-hp') {
    if (rows.length === 4 && rows.every(r => r.name && r.hp && !r.dungeon)) {
      return { success: true, feedback: 'İsim ve HP seçimi doğru!', damage: 12, critical: false, xpAwarded: 6 };
    }
  }

  if (signature === 'select-hp-dungeon') {
    if (rows.length === 4 && rows.every(r => r.hp && r.dungeon && !r.name)) {
      return { success: true, feedback: 'HP ve dungeon seçimi doğru!', damage: 12, critical: false, xpAwarded: 6 };
    }
  }

  if (signature === 'select-first-two') {
    if (rows.length === 2 && rows.every(r => r.name)) {
      return { success: true, feedback: 'İlk 2 goblin\'i seçtin!', damage: 12, critical: false, xpAwarded: 6 };
    }
  }

  if (signature === 'select-first-three') {
    if (rows.length === 3 && rows.every(r => r.name)) {
      return { success: true, feedback: 'İlk 3 goblin\'i seçtin!', damage: 15, critical: false, xpAwarded: 7 };
    }
  }

  // MODULE 2: WHERE ve Filtreleme
  if (signature === 'where-sewer-goblins') {
    if (rows.length === 2 && rows.every(r => r.dungeon === 'Sewer')) {
      return { success: true, feedback: 'Sewer dungeon\'undaki goblins bulundu!', damage: 15, critical: false, xpAwarded: 8 };
    }
  }

  if (signature === 'where-ruins-goblins') {
    if (rows.length === 2 && rows.every(r => r.dungeon === 'Ruins')) {
      return { success: true, feedback: 'Ruins dungeon\'undaki goblins bulundu!', damage: 15, critical: false, xpAwarded: 8 };
    }
  }

  if (signature === 'where-high-hp') {
    if (rows.length === 3 && rows.every(r => r.hp > 20)) {
      return { success: true, feedback: 'HP 20den fazla goblins bulundu!', damage: 18, critical: false, xpAwarded: 9 };
    }
  }

  if (signature === 'where-low-hp') {
    if (rows.length === 3 && rows.every(r => r.hp < 30)) {
      return { success: true, feedback: 'HP 30dan az goblins bulundu!', damage: 18, critical: false, xpAwarded: 9 };
    }
  }

  if (signature === 'where-exact-hp') {
    if (rows.length === 1 && rows[0].hp === 22) {
      return { success: true, feedback: 'HP 22 olan goblin bulundu!', damage: 15, critical: false, xpAwarded: 8 };
    }
  }

  if (signature === 'where-sewer-high-hp') {
    if (rows.length === 1 && rows[0].dungeon === 'Sewer' && rows[0].hp > 20) {
      return { success: true, feedback: 'Sewer\'de yüksek HP goblin bulundu!', damage: 20, critical: true, xpAwarded: 10 };
    }
  }

  if (signature === 'where-scout-name') {
    if (rows.length === 1 && (rows[0].name as string).includes('Scout')) {
      return { success: true, feedback: 'Scout isimli goblin bulundu!', damage: 15, critical: false, xpAwarded: 8 };
    }
  }

  if (signature === 'where-high-hp-names') {
    if (rows.length === 3 && rows.every(r => r.name && r.hp > 30)) {
      return { success: true, feedback: 'Yüksek HP goblins isimler seçildi!', damage: 20, critical: false, xpAwarded: 10 };
    }
  }

  if (signature === 'where-sewer-details') {
    if (rows.length === 2 && rows.every(r => r.dungeon === 'Sewer' && r.name && r.hp)) {
      return { success: true, feedback: 'Sewer dungeon detayları bulundu!', damage: 20, critical: false, xpAwarded: 10 };
    }
  }

  if (signature === 'where-hp-range') {
    if (rows.length === 3 && rows.every(r => r.hp >= 20 && r.hp <= 35)) {
      return { success: true, feedback: 'HP 20-35 aralığı filtresi doğru!', damage: 22, critical: true, xpAwarded: 11 };
    }
  }

  // MODULE 3: ORDER BY ve LIMIT
  if (signature === 'order-by-name-asc') {
    if (rows.length === 4 && (rows[0].name as string).includes('Bruiser')) {
      return { success: true, feedback: 'Alphabetik sıralama ASC doğru!', damage: 18, critical: false, xpAwarded: 9 };
    }
  }

  if (signature === 'order-by-name-desc') {
    if (rows.length === 4 && (rows[0].name as string).includes('Shaman')) {
      return { success: true, feedback: 'Alphabetik sıralama DESC doğru!', damage: 18, critical: false, xpAwarded: 9 };
    }
  }

  if (signature === 'order-by-hp-asc') {
    if (rows.length === 4 && rows[0].hp === 18) {
      return { success: true, feedback: 'HP artan sıralama doğru!', damage: 18, critical: false, xpAwarded: 9 };
    }
  }

  if (signature === 'order-by-hp-desc') {
    if (rows.length === 4 && rows[0].hp === 45) {
      return { success: true, feedback: 'HP azalan sıralama doğru!', damage: 18, critical: false, xpAwarded: 9 };
    }
  }

  if (signature === 'order-lowest-hp') {
    if (rows.length === 1 && rows[0].hp === 18) {
      return { success: true, feedback: 'En düşük HP bulundu!', damage: 20, critical: true, xpAwarded: 10 };
    }
  }

  if (signature === 'order-highest-hp') {
    if (rows.length === 1 && rows[0].hp === 45) {
      return { success: true, feedback: 'En yüksek HP bulundu!', damage: 20, critical: true, xpAwarded: 10 };
    }
  }

  if (signature === 'order-first-two-by-name') {
    if (rows.length === 2 && (rows[0].name as string).includes('Bruiser')) {
      return { success: true, feedback: 'İlk 2 goblin ada göre sıralanmış!', damage: 20, critical: false, xpAwarded: 10 };
    }
  }

  if (signature === 'order-sewer-by-hp-desc') {
    if (rows.length === 2 && rows.every(r => r.dungeon === 'Sewer') && rows[0].hp > rows[1].hp) {
      return { success: true, feedback: 'Sewer goblins HP\'ye göre DESC sıralanmış!', damage: 25, critical: true, xpAwarded: 12 };
    }
  }

  if (signature === 'order-top-3-hp') {
    if (rows.length === 3 && rows[0].hp >= rows[1].hp && rows[1].hp >= rows[2].hp) {
      return { success: true, feedback: 'Top 3 HP seçildi!', damage: 22, critical: false, xpAwarded: 11 };
    }
  }

  if (signature === 'order-last-2-by-name') {
    if (rows.length === 2) {
      return { success: true, feedback: 'Son 2 goblin ada göre seçildi!', damage: 22, critical: false, xpAwarded: 11 };
    }
  }

  // MODULE 4: GROUP BY ve Aggregates
  if (signature === 'group-count-by-dungeon') {
    const dungeons = rows.filter(r => r.dungeon);
    if (dungeons.length === 2 && dungeons.every(r => r.count === 2 || r.goblin_count === 2)) {
      return { success: true, feedback: 'GROUP BY COUNT doğru!', damage: 25, critical: true, xpAwarded: 15 };
    }
  }

  if (signature === 'group-sum-hp-by-dungeon') {
    if (rows.length === 2 && rows.every(r => r.total_hp || r.sum)) {
      return { success: true, feedback: 'GROUP BY SUM HP doğru!', damage: 25, critical: true, xpAwarded: 15 };
    }
  }

  if (signature === 'group-avg-hp-by-dungeon') {
    if (rows.length === 2 && rows.every(r => r.avg_hp || r.avg)) {
      return { success: true, feedback: 'GROUP BY AVG HP doğru!', damage: 25, critical: true, xpAwarded: 15 };
    }
  }

  if (signature === 'group-total-hp') {
    if (rows.length === 1) {
      const total = rows[0].total_hp || rows[0].sum || rows[0].hp;
      if (total === 117) { // 18+32+22+45
        return { success: true, feedback: 'Toplam HP hesaplanmış!', damage: 20, critical: false, xpAwarded: 12 };
      }
    }
  }

  if (signature === 'group-avg-hp') {
    if (rows.length === 1) {
      return { success: true, feedback: 'Ortalama HP hesaplanmış!', damage: 20, critical: false, xpAwarded: 12 };
    }
  }

  if (signature === 'group-max-min-hp') {
    if (rows.length === 1 && (rows[0].max_hp || rows[0].max) && (rows[0].min_hp || rows[0].min)) {
      return { success: true, feedback: 'Max ve Min HP bulundu!', damage: 28, critical: true, xpAwarded: 14 };
    }
  }

  if (signature === 'group-dungeon-count-detailed') {
    if (rows.length === 2 && rows.every(r => r.dungeon && (r.count || r.goblin_count))) {
      return { success: true, feedback: 'Dungeon ve goblin sayıları seçildi!', damage: 25, critical: false, xpAwarded: 13 };
    }
  }

  if (signature === 'group-stats-by-dungeon') {
    if (rows.length === 2 && rows.every(r => r.dungeon && (r.sum || r.total_hp) && (r.avg || r.avg_hp))) {
      return { success: true, feedback: 'Dungeon istatistikleri tamam!', damage: 30, critical: true, xpAwarded: 16 };
    }
  }

  if (signature === 'group-having-avg-hp') {
    if (rows.length >= 1 && rows.every(r => r.avg_hp > 20 || r.avg > 20)) {
      return { success: true, feedback: 'HAVING koşulu doğru!', damage: 32, critical: true, xpAwarded: 18 };
    }
  }

  if (signature === 'group-max-goblins-dungeon') {
    if (rows.length === 1 && rows[0].dungeon) {
      return { success: true, feedback: 'En çok goblin dungeon bulundu!', damage: 32, critical: true, xpAwarded: 18 };
    }
  }

  // MODULE 5: Advanced Queries
  if (signature === 'advanced-sewer-sorted') {
    if (rows.length === 2 && rows.every(r => r.dungeon === 'Sewer' && r.name && r.hp)) {
      return { success: true, feedback: 'Advanced Sewer sorgusu başarılı!', damage: 35, critical: true, xpAwarded: 20 };
    }
  }

  if (signature === 'advanced-top-2-strongest') {
    if (rows.length === 2 && rows[0].hp >= rows[1].hp) {
      return { success: true, feedback: 'Top 2 güçlü goblin bulundu!', damage: 35, critical: true, xpAwarded: 20 };
    }
  }

  if (signature === 'advanced-max-per-dungeon') {
    if (rows.length === 2) {
      return { success: true, feedback: 'Her dungeon\'un max HP si bulundu!', damage: 40, critical: true, xpAwarded: 25 };
    }
  }

  if (signature === 'advanced-names-start-with-a') {
    if (rows.every(r => (r.name as string).startsWith('G'))) {
      return { success: true, feedback: 'LIKE pattern seçimi doğru!', damage: 28, critical: false, xpAwarded: 14 };
    }
  }

  if (signature === 'advanced-high-hp-grouped') {
    if (rows.length >= 1 && rows.every(r => r.hp > 30 && r.dungeon && r.count)) {
      return { success: true, feedback: 'WHERE + GROUP BY advanced doğru!', damage: 40, critical: true, xpAwarded: 25 };
    }
  }

  if (signature === 'advanced-above-avg-hp') {
    if (rows.length >= 1 && rows.every(r => r.hp > 29)) {
      return { success: true, feedback: 'Subquery ile average karşılaştırma doğru!', damage: 45, critical: true, xpAwarded: 28 };
    }
  }

  if (signature === 'advanced-max-per-dungeon-count') {
    if (rows.length === 1 && rows[0].max_count) {
      return { success: true, feedback: 'MAX COUNT hesaplaması doğru!', damage: 42, critical: true, xpAwarded: 26 };
    }
  }

  if (signature === 'advanced-ruins-weakest') {
    if (rows.length === 1 && rows[0].dungeon === 'Ruins') {
      return { success: true, feedback: 'Ruins en zayıf goblin bulundu!', damage: 35, critical: true, xpAwarded: 20 };
    }
  }

  if (signature === 'advanced-dungeon-stats') {
    if (rows.length === 2 && rows.every(r => r.dungeon && r.count && r.avg_hp)) {
      return { success: true, feedback: 'Dungeon istatistikleri eksiksiz!', damage: 45, critical: true, xpAwarded: 28 };
    }
  }

  if (signature === 'advanced-top-3-by-hp') {
    if (rows.length === 3 && rows[0].hp >= rows[1].hp && rows[1].hp >= rows[2].hp) {
      return { success: true, feedback: 'Top 3 HP ile isimler doğru!', damage: 40, critical: true, xpAwarded: 25 };
    }
  }

  // Eski soruları da destekle
  if (signature === 'min-goblin-hp') {
    const row = rows[0];
    if (!row) {
      return { success: false, feedback: 'Sonuc bos dondu.', damage: 0, critical: false, xpAwarded: 0 };
    }

    const hp = getNumericValue(row, ['hp', 'min', 'min_hp']);
    if (hp === 18) {
      return {
        success: true,
        feedback: 'En dusuk HP hedefi dogru bulundu.',
        damage: 25,
        critical: false,
        xpAwarded: 10,
      };
    }
  }

  if (signature === 'goblin-count-by-dungeon') {
    const counts = rows
      .map((row) => ({
        dungeon: getTextValue(row, ['dungeon']),
        count: getNumericValue(row, ['count', 'goblin_count']),
      }))
      .filter((item) => item.dungeon && item.count !== null);

    const sewer = counts.find((item) => item.dungeon?.toLowerCase() === 'sewer' && item.count === 2);
    const ruins = counts.find((item) => item.dungeon?.toLowerCase() === 'ruins' && item.count === 2);

    if (sewer && ruins) {
      return {
        success: true,
        feedback: 'GROUP BY sonucu dogru.',
        damage: 40,
        critical: true,
        xpAwarded: 20,
      };
    }
  }

  if (signature === 'high-hp-goblins') {
    const names = rows
      .map((row) => getTextValue(row, ['name', 'goblin_name']))
      .filter((name): name is string => Boolean(name));

    const hasExpectedOrder = names.join('|') === 'Goblin Captain|Goblin Bruiser|Goblin Shaman';
    if (hasExpectedOrder) {
      return {
        success: true,
        feedback: 'Filtre ve siralama dogru.',
        damage: 50,
        critical: true,
        xpAwarded: 30,
      };
    }
  }

  return {
    success: false,
    feedback: 'Sorgu calisti ama beklenen sonuca ulasmadi.',
    damage: 0,
    critical: false,
    xpAwarded: 0,
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse(failedResponse('Method not allowed'));
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse(failedResponse('Supabase ortam degiskenleri eksik.'));
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const { challengeId, sql } = await request.json();
    const normalizedChallengeId = Number(challengeId);

    if (Number.isNaN(normalizedChallengeId) || typeof sql !== 'string') {
      return jsonResponse(failedResponse('challengeId ve sql zorunlu.'));
    }

    // Authorization header'dan JWT çıkar ve user_id al
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.replace('Bearer ', '');
    
    let userId: string | null = null;
    if (bearerToken) {
      try {
        const { data, error } = await adminClient.auth.getUser(bearerToken);
        if (data?.user) userId = data.user.id;
      } catch {
        // JWT parse hatası, user_id'siz devam et
      }
    }

    // Eğer user authenticated ise daha önce başarıyla çözdüğü soruyu kontrol et
    if (userId) {
      const { data: previousAttempt } = await adminClient
        .from('attempts')
        .select('id')
        .eq('user_id', userId)
        .eq('challenge_id', normalizedChallengeId)
        .eq('was_success', true)
        .single();
      
      if (previousAttempt) {
        return jsonResponse({
          success: false,
          feedback: 'Bu soruyu zaten başarıyla çözmüşsün! Sonraki soruya geç.',
          damage: 0,
          critical: false,
          xpAwarded: 0,
          alreadySolved: true,
        });
      }
    }

    const validationError = validateSql(sql);
    if (validationError) {
      return jsonResponse(failedResponse(validationError));
    }

    const { data: challenge, error: challengeError } = await adminClient
      .from('challenges')
      .select('id, expected_signature')
      .eq('id', normalizedChallengeId)
      .single();

    if (challengeError || !challenge) {
      return jsonResponse(failedResponse('Challenge bulunamadi.'));
    }

    const { data: rows, error: executeError } = await adminClient.rpc('execute_arena_sql', {
      query_text: sql,
    });

    if (executeError) {
      return jsonResponse(failedResponse(executeError.message));
    }

    const parsedRows = Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
    const typedChallenge = challenge as ChallengeRow;
    const response = evaluateAttempt(typedChallenge.expected_signature, parsedRows);
    return jsonResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata.';
    return jsonResponse(failedResponse(message));
  }
});
