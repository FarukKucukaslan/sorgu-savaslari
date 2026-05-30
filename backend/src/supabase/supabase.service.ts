import { Injectable } from '@nestjs/common';
import { supabase } from '../config/supabase.config';

@Injectable()
export class SupabaseService {
  /**
   * Supabase client'ı döndür (service key ile)
   */
  getClient() {
    return supabase;
  }

  /**
   * Sorgu savaşlarını veritabanından getir
   */
  async getArenaQuestions() {
    const { data, error } = await supabase
      .from('arena_questions')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch arena questions: ${error.message}`);
    }

    return data;
  }

  /**
   * Kullanıcı skorlarını getir
   */
  async getUserScores(userId: string) {
    const { data, error } = await supabase
      .from('user_scores')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch user scores: ${error.message}`);
    }

    return data;
  }

  /**
   * Yeni skor kaydet
   */
  async saveScore(userId: string, score: number, arenaId: string) {
    const { data, error } = await supabase
      .from('user_scores')
      .insert([
        {
          user_id: userId,
          score: score,
          arena_id: arenaId,
          created_at: new Date(),
        },
      ]);

    if (error) {
      throw new Error(`Failed to save score: ${error.message}`);
    }

    return data;
  }
}
