import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ArenaService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Tüm arena soruşlarını getir
   */
  async getArenaQuestions() {
    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase
        .from('arena_questions')
        .select('*');

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch questions: ${error.message}`);
    }
  }

  /**
   * Spesifik arena sorusunu ID ile getir
   */
  async getQuestion(questionId: string) {
    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase
        .from('arena_questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch question: ${error.message}`);
    }
  }

  /**
   * Kullanıcının skorunu doğrula ve kaydet
   */
  async submitScore(
    userId: string,
    questionId: string,
    isCorrect: boolean,
    timeSpent: number,
  ) {
    try {
      const supabase = this.supabaseService.getClient();

      // Soruyu getir ve doğru cevabı kontrol et
      const { data: questionData } = await supabase
        .from('arena_questions')
        .select('correct_answer')
        .eq('id', questionId)
        .single();

      if (!questionData) {
        throw new Error('Soru bulunamadı');
      }

      // Puan hesapla (zaman bonus dahil)
      let points = isCorrect ? 10 : 0;
      if (isCorrect && timeSpent < 30) {
        points += 5; // Hızlı cevap bonusu
      }

      // Skoru kaydet
      const { data, error } = await supabase.from('user_scores').insert([
        {
          user_id: userId,
          question_id: questionId,
          is_correct: isCorrect,
          points: points,
          time_spent: timeSpent,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        points,
        message: isCorrect ? 'Doğru cevap!' : 'Yanlış cevap',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to submit score: ${error.message}`);
    }
  }

  /**
   * Kullanıcının toplam puanını getir
   */
  async getUserLeaderboardScore(userId: string) {
    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase
        .from('user_scores')
        .select('points')
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
      }

      const totalPoints = data.reduce((sum, row) => sum + (row.points || 0), 0);

      return {
        success: true,
        userId,
        totalPoints,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch user score: ${error.message}`,
      );
    }
  }

  /**
   * Leaderboard'u getir (top 10)
   */
  async getLeaderboard() {
    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase
        .from('user_scores')
        .select('user_id, points')
        .order('points', { ascending: false })
        .limit(100);

      if (error) {
        throw new Error(error.message);
      }

      // Kullanıcı başına toplam puanları hesapla
      const leaderboard = {};
      data.forEach((row) => {
        if (leaderboard[row.user_id]) {
          leaderboard[row.user_id] += row.points || 0;
        } else {
          leaderboard[row.user_id] = row.points || 0;
        }
      });

      // Sıralama yap ve top 10'u döndür
      const topUsers = Object.entries(leaderboard)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 10)
        .map(([userId, points], rank) => ({
          rank: rank + 1,
          userId,
          totalPoints: points,
        }));

      return {
        success: true,
        leaderboard: topUsers,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch leaderboard: ${error.message}`,
      );
    }
  }
}
