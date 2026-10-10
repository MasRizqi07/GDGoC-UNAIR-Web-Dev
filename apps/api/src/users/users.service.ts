import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { RegisterDto } from '@gdgoc/contracts';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: RegisterDto) {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already in use'); // Auth controller will catch and mask this
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
