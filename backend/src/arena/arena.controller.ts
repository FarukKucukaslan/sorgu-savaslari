import { Controller, Get, Post, Body, Param, BadRequestException } from '@nestjs/common';
import { ArenaService } from './arena.service';

@Controller('api/arena')
export class ArenaController {
  constructor(private readonly arenaService: ArenaService) {}

  /**
   * Tüm arena soruşlarını getir
   */
  @Get('questions')
  async getArenaQuestions() {
    return this.arenaService.getArenaQuestions();
  }

  /**
   * Spesifik arena sorusunu ID ile getir
   */
  @Get('questions/:id')
  async getQuestion(@Param('id') id: string) {
    return this.arenaService.getQuestion(id);
  }

  /**
   * Kullanıcının skorunu doğrula ve kaydet
   */
  @Post('submit-score')
  async submitScore(
    @Body()
    body: {
      userId: string;
      questionId: string;
      isCorrect: boolean;
      timeSpent: number;
    },
  ) {
    if (!body.userId || !body.questionId) {
      throw new BadRequestException('userId ve questionId zorunludur');
    }

    return this.arenaService.submitScore(
      body.userId,
      body.questionId,
      body.isCorrect,
      body.timeSpent,
    );
  }

  /**
   * Kullanıcının leaderboard puanını getir
   */
  @Get('leaderboard/:userId')
  async getUserLeaderboardScore(@Param('userId') userId: string) {
    return this.arenaService.getUserLeaderboardScore(userId);
  }

  /**
   * Top 10 kullanıcıyı getir
   */
  @Get('leaderboard')
  async getLeaderboard() {
    return this.arenaService.getLeaderboard();
  }
}
