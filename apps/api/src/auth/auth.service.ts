import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import type { RegisterDto, LoginDto } from '@gdgoc/contracts';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';

import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(registerDto: RegisterDto) {
    try {
      const user = await this.usersService.create(registerDto);
      // Omit password hash from response
      const { passwordHash: _passwordHash, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new BadRequestException('Email already in use'); // generic error
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Invalid credentials');
    }

    // Omit passwordHash
    const { passwordHash: _passwordHash, ...userData } = user;
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    // Generate tokens
    const accessToken = await this.jwtService.signAsync(payload);
    
    // Refresh token rotation
    const familyId = crypto.randomUUID();
    const refreshToken = crypto.randomUUID();
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        familyId,
        expiresAt,
      },
    });

    return {
      user: userData,
      accessToken,
      refreshToken,
    };
  }

  async refresh(oldToken: string) {
    const tokenHash = this.hashToken(oldToken);
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException();
    }

    if (tokenRecord.revoked) {
      // Refresh token reuse detected! Revoke whole family.
      await this.prisma.refreshToken.updateMany({
        where: { familyId: tokenRecord.familyId },
        data: { revoked: true },
      });
      throw new UnauthorizedException('Token reuse detected');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Token expired');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true },
    });

    const user = await this.usersService.findById(tokenRecord.userId);
    if (!user) throw new UnauthorizedException();

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    const newRefreshToken = crypto.randomUUID();
    const newTokenHash = this.hashToken(newRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: newTokenHash,
        userId: user.id,
        familyId: tokenRecord.familyId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }
}
