import { createClient } from 'npm:@supabase/supabase-js@2';

type ArenaResponse = {
  success: boolean;
  feedback: string;
  damage: number;
  critical: boolean;
  xpAwarded: number;
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

    const { challengeId, sql } = await request.json();
    const normalizedChallengeId = Number(challengeId);

    if (Number.isNaN(normalizedChallengeId) || typeof sql !== 'string') {
      return jsonResponse(failedResponse('challengeId ve sql zorunlu.'));
    }

    const validationError = validateSql(sql);
    if (validationError) {
      return jsonResponse(failedResponse(validationError));
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

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
