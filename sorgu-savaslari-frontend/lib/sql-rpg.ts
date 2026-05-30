import { supabase } from '@/lib/supabase';

// ======================================
// CHALLENGE & BASIC TYPES
// ======================================

export type Challenge = {
  id: number;
  prompt: string;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  hint: string | null;
  expectedSignature: string | null;
  moduleId?: number | null;
  orderInModule?: number;
  requiredXp?: number;
};

// ======================================
// GAMIFICATION TYPES
// ======================================

export type Module = {
  id: number;
  name: string;
  description: string | null;
  orderIndex: number;
  sqlConcept: string;
  requiredLevel: number;
};

export type UserProfile = {
  userId: string;
  username: string;
  level: number;
  totalXp: number;
  totalDamage: number;
  totalCriticalHits: number;
  totalSuccesses: number;
  totalAttempts: number;
  currentCombo: number;
  bestCombo: number;
  characterTitle: string | null;
  lastActive: string;
};

export type UserSkill = {
  id: number;
  userId: string;
  skillKey: string;
  unlockedAt: string | null;
  completed: boolean;
  completedAt: string | null;
};

export type Achievement = {
  id: number;
  key: string;
  title: string;
  description: string | null;
  icon: string | null;
  rewardXp: number;
};

export type UserAchievement = {
  id: number;
  userId: string;
  achievementId: number;
  unlockedAt: string;
};

export type UserModuleProgress = {
  id: number;
  userId: string;
  moduleId: number;
  progressPercent: number;
  unlocked: boolean;
  completed: boolean;
  completedAt: string | null;
  lastChallengeId: number | null;
};

export type DailyChallenge = {
  id: number;
  challengeId: number;
  dateActive: string;
  rewardMultiplier: number;
};

export type UserDailyAttempt = {
  id: number;
  userId: string;
  dailyChallengeId: number;
  success: boolean;
  xpEarned: number;
  submittedAt: string;
};

export type LeaderboardEntry = {
  userId: string;
  username: string;
  totalXp: number;
  rank: number;
  damageDealt: number;
  attempts: number;
  successRate: number;
};

export type SubmitSqlAttemptResult = {
  success: boolean;
  feedback: string;
  damage: number;
  critical: boolean;
  xpAwarded: number;
};

type SubmitSqlAttemptParams = {
  challengeId: number;
  sqlText: string;
};

export function validateSqlForArena(sqlText: string): { ok: boolean; reason?: string } {
  const trimmed = sqlText.trim();

  if (!trimmed) {
    return { ok: false, reason: 'Sorgu bos olamaz.' };
  }

  if (trimmed.includes(';')) {
    return { ok: false, reason: 'Guvenlik icin noktali virgul kullanma.' };
  }

  if (!/^select\b/i.test(trimmed)) {
    return { ok: false, reason: 'Sadece SELECT sorgularina izin verilir.' };
  }

  if (/\b(insert|update|delete|drop|alter|create|grant|revoke|truncate)\b/i.test(trimmed)) {
    return { ok: false, reason: 'Yazma veya DDL komutlari yasak.' };
  }

  return { ok: true };
}

export async function getChallenges(limit = 10): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('id, prompt, difficulty, hint, expected_signature, module_id, order_in_module, required_xp')
    .order('id', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => ({
    id: Number(item.id),
    prompt: item.prompt,
    difficulty: item.difficulty,
    hint: item.hint,
    expectedSignature: item.expected_signature ?? null,
    moduleId: item.module_id ?? null,
    orderInModule: item.order_in_module ?? 0,
    requiredXp: item.required_xp ?? 0,
  }));
}

export async function submitSqlAttempt({
  challengeId,
  sqlText,
}: SubmitSqlAttemptParams): Promise<SubmitSqlAttemptResult> {
  const { data, error } = await supabase.functions.invoke<SubmitSqlAttemptResult>('submit-sql', {
    body: {
      challengeId,
      sql: sqlText,
    },
  });

  if (error) {
    const maybeContext = (
      typeof error === 'object' && error !== null && 'context' in error ? error.context : null
    ) as { json?: () => Promise<unknown>; text?: () => Promise<string>; status?: number } | null;

    if (maybeContext?.json) {
      try {
        const context = await maybeContext.json();
        if (
          context &&
          typeof context === 'object' &&
          'error' in context &&
          typeof context.error === 'string'
        ) {
          throw new Error(context.error);
        }
      } catch {
        // try plain text fallback below
      }
    }

    if (maybeContext?.text) {
      try {
        const text = await maybeContext.text();
        if (text.trim()) {
          throw new Error(text);
        }
      } catch {
        // use default message below
      }
    }

    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Fonksiyon bos cevap dondurdu.');
  }

  return data;
}

// ======================================
// GAMIFICATION FUNCTIONS
// ======================================

// MODULES
export async function getModules(): Promise<Module[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => ({
    id: Number(item.id),
    name: item.name,
    description: item.description,
    orderIndex: item.order_index,
    sqlConcept: item.sql_concept,
    requiredLevel: item.required_level,
  }));
}

// USER PROFILE
export async function getOrCreateUserProfile(userId: string, username: string): Promise<UserProfile> {
  // Try to fetch existing profile
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    return mapUserProfile(existing);
  }

  // Generate unique username - use user_id as fallback
  const uniqueUsername = username && username.trim() 
    ? `${username}_${userId.substring(0, 6)}` 
    : `Player_${userId.substring(0, 12)}`;

  // If no profile found, use upsert to create or do nothing if exists
  const { data: created, error } = await supabase
    .from('user_profiles')
    .upsert([{
      user_id: userId,
      username: uniqueUsername,
      level: 1,
      total_xp: 0,
    }], { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    // If upsert fails, try to fetch the existing profile
    const { data: fallback } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (fallback) return mapUserProfile(fallback);
    throw new Error(error.message);
  }

  return mapUserProfile(created);
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return mapUserProfile(data);
}

function mapUserProfile(row: any): UserProfile {
  return {
    userId: row.user_id,
    username: row.username,
    level: row.level,
    totalXp: row.total_xp,
    totalDamage: row.total_damage,
    totalCriticalHits: row.total_critical_hits,
    totalSuccesses: row.total_successes,
    totalAttempts: row.total_attempts,
    currentCombo: row.current_combo,
    bestCombo: row.best_combo,
    characterTitle: row.character_title,
    lastActive: row.last_active,
  };
}

export async function updateUserProfileAfterChallenge(
  userId: string,
  xpEarned: number,
  damageDone: number,
  wasCritical: boolean,
  wasSuccess: boolean
): Promise<UserProfile> {
  const profile = await getUserProfile(userId);
  if (!profile) throw new Error('Profil bulunamadi.');

  const newTotalXp = profile.totalXp + xpEarned;
  const newLevel = Math.floor(1 + newTotalXp / 500);
  const newCombo = wasSuccess ? profile.currentCombo + 1 : 0;
  const newBestCombo = Math.max(profile.bestCombo, newCombo);

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      total_xp: newTotalXp,
      level: newLevel,
      total_damage: profile.totalDamage + damageDone,
      total_critical_hits: profile.totalCriticalHits + (wasCritical ? 1 : 0),
      total_successes: profile.totalSuccesses + (wasSuccess ? 1 : 0),
      total_attempts: profile.totalAttempts + 1,
      current_combo: newCombo,
      best_combo: newBestCombo,
      last_active: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapUserProfile(data);
}

// ACHIEVEMENTS
export async function getAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('reward_xp', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => ({
    id: Number(item.id),
    key: item.key,
    title: item.title,
    description: item.description,
    icon: item.icon,
    rewardXp: item.reward_xp,
  }));
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => ({
    id: Number(item.id),
    userId: item.user_id,
    achievementId: Number(item.achievement_id),
    unlockedAt: item.unlocked_at,
  }));
}

export async function unlockAchievement(userId: string, achievementKey: string): Promise<boolean> {
  const { data: achievement } = await supabase
    .from('achievements')
    .select('id')
    .eq('key', achievementKey)
    .single();

  if (!achievement) return false;

  const { error } = await supabase
    .from('user_achievements')
    .insert([{
      user_id: userId,
      achievement_id: achievement.id,
    }])
    .select();

  return !error;
}

// MODULE PROGRESS
export async function getUserModuleProgress(userId: string): Promise<UserModuleProgress[]> {
  const { data, error } = await supabase
    .from('user_module_progress')
    .select('*')
    .eq('user_id', userId)
    .order('module_id', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => ({
    id: Number(item.id),
    userId: item.user_id,
    moduleId: Number(item.module_id),
    progressPercent: item.progress_percent,
    unlocked: item.unlocked,
    completed: item.completed,
    completedAt: item.completed_at,
    lastChallengeId: item.last_challenge_id ? Number(item.last_challenge_id) : null,
  }));
}

export async function initializeModuleProgressForNewUser(userId: string): Promise<void> {
  const modules = await getModules();
  
  for (const mod of modules) {
    const unlocked = mod.requiredLevel <= 1;
    
    await supabase
      .from('user_module_progress')
      .insert([{
        user_id: userId,
        module_id: mod.id,
        progress_percent: 0,
        unlocked: unlocked,
        completed: false,
      }]);
  }
}

export async function updateModuleProgress(
  userId: string,
  moduleId: number,
  challengeId: number,
  wasSuccess: boolean
): Promise<UserModuleProgress> {
  let progress = await supabase
    .from('user_module_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .single();

  if (!progress.data) {
    throw new Error('Module progress bulunamadi.');
  }

  const currentData = progress.data;
  const newProgressPercent = Math.min(100, currentData.progress_percent + (wasSuccess ? 10 : 0));
  const isCompleted = newProgressPercent >= 100;

  const { data: updated, error } = await supabase
    .from('user_module_progress')
    .update({
      progress_percent: newProgressPercent,
      completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      last_challenge_id: challengeId,
    })
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  return {
    id: Number(updated.id),
    userId: updated.user_id,
    moduleId: Number(updated.module_id),
    progressPercent: updated.progress_percent,
    unlocked: updated.unlocked,
    completed: updated.completed,
    completedAt: updated.completed_at,
    lastChallengeId: updated.last_challenge_id ? Number(updated.last_challenge_id) : null,
  };
}

// DAILY CHALLENGES
export async function getDailyChallenge(): Promise<(Challenge & { dailyChallengeId: number; multiplier: number }) | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data: daily } = await supabase
    .from('daily_challenges')
    .select('id, challenge_id, reward_multiplier')
    .eq('date_active', today)
    .single();

  if (!daily) return null;

  const challenge = await supabase
    .from('challenges')
    .select('*')
    .eq('id', daily.challenge_id)
    .single();

  if (challenge.error || !challenge.data) return null;

  return {
    ...mapChallenge(challenge.data),
    dailyChallengeId: Number(daily.id),
    multiplier: Number(daily.reward_multiplier),
  };
}

export async function recordDailyAttempt(
  userId: string,
  dailyChallengeId: number,
  success: boolean,
  xpEarned: number
): Promise<void> {
  const { error } = await supabase
    .from('user_daily_attempts')
    .insert([{
      user_id: userId,
      daily_challenge_id: dailyChallengeId,
      success: success,
      xp_earned: xpEarned,
    }]);

  if (error) throw new Error(error.message);
}

// LEADERBOARD
export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id, username, total_xp, total_damage, total_attempts, total_successes')
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((item, index) => ({
    userId: item.user_id,
    username: item.username,
    totalXp: item.total_xp,
    rank: index + 1,
    damageDealt: item.total_damage,
    attempts: item.total_attempts,
    successRate: item.total_attempts > 0 ? (item.total_successes / item.total_attempts) * 100 : 0,
  }));
}

// SKILL TREE
export async function getUserSkills(userId: string): Promise<UserSkill[]> {
  const { data, error } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => ({
    id: Number(item.id),
    userId: item.user_id,
    skillKey: item.skill_key,
    unlockedAt: item.unlocked_at,
    completed: item.completed,
    completedAt: item.completed_at,
  }));
}

export async function unlockSkill(userId: string, skillKey: string): Promise<void> {
  const { error } = await supabase
    .from('user_skills')
    .insert([{
      user_id: userId,
      skill_key: skillKey,
      unlocked_at: new Date().toISOString(),
    }]);

  if (error && !error.message.includes('duplicate')) {
    throw new Error(error.message);
  }
}

function mapChallenge(row: any): Challenge {
  return {
    id: Number(row.id),
    prompt: row.prompt,
    difficulty: row.difficulty,
    hint: row.hint,
    expectedSignature: row.expected_signature,
    moduleId: row.module_id ? Number(row.module_id) : undefined,
    orderInModule: row.order_in_module,
    requiredXp: row.required_xp,
  };
}
