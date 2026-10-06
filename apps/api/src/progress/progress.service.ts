import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProgressDto } from '@gdgoc/contracts';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async getAllProgress(userId: string) {
    return this.prisma.progress.findMany({ where: { userId } });
  }

  async getProgress(userId: string, tutorialId: string) {
    let prog = await this.prisma.progress.findUnique({
      where: { userId_tutorialId: { userId, tutorialId } },
    });
    if (!prog) {
      prog = await this.prisma.progress.create({
        data: { userId, tutorialId },
      });
    }
    return prog;
  }

  async updateProgress(userId: string, tutorialId: string, data: UpdateProgressDto) {
    return this.prisma.progress.upsert({
      where: { userId_tutorialId: { userId, tutorialId } },
      update: {
        completed: data.completed,
        completedAt: data.completed ? new Date() : null,
      },
      create: {
        userId,
        tutorialId,
        completed: data.completed,
        completedAt: data.completed ? new Date() : null,
      },
    });
  }
}
