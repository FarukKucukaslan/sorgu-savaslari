// API base URL - geliştirme sırasında kendi bilgisayarınız için localhost kullanın
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiClient {
  /**
   * GET isteği yap
   */
  static async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  }

  /**
   * POST isteği yap
   */
  static async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  }
}

export class ArenaApi {
  /**
   * Tüm arena soruşlarını getir
   */
  static async getArenaQuestions() {
    return ApiClient.get('/api/arena/questions');
  }

  /**
   * Spesifik soruyu getir
   */
  static async getQuestion(questionId: string) {
    return ApiClient.get(`/api/arena/questions/${questionId}`);
  }

  /**
   * Skoru kaydet
   */
  static async submitScore(
    userId: string,
    questionId: string,
    isCorrect: boolean,
    timeSpent: number,
  ) {
    return ApiClient.post('/api/arena/submit-score', {
      userId,
      questionId,
      isCorrect,
      timeSpent,
    });
  }

  /**
   * Leaderboard'u getir
   */
  static async getLeaderboard() {
    return ApiClient.get('/api/arena/leaderboard');
  }

  /**
   * Kullanıcının skorunu getir
   */
  static async getUserScore(userId: string) {
    return ApiClient.get(`/api/arena/leaderboard/${userId}`);
  }
}
