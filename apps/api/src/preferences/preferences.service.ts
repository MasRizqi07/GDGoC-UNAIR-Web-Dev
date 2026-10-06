import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdatePreferenceDto } from '@gdgoc/contracts';

@Injectable()
export class PreferencesService {
  constructor(private prisma: PrismaService) {}

  async getPreferences(userId: string) {
    let pref = await this.prisma.preference.findUnique({ where: { userId } });
    if (!pref) {
      pref = await this.prisma.preference.create({ data: { userId } });
    }
    return pref;
  }

  async updatePreferences(userId: string, data: UpdatePreferenceDto) {
    return this.prisma.preference.upsert({
      where: { userId },
      update: { theme: data.theme },
      create: { userId, theme: data.theme },
    });
  }
}
