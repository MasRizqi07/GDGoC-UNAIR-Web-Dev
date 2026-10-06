import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import type { RegisterDto, LoginDto } from '@gdgoc/contracts';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const user = await this.usersService.create(registerDto);
      // Omit password hash from response
      const { passwordHash, ...result } = user;
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
    const { passwordHash, ...userData } = user;
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    // Generate tokens
    const accessToken = await this.jwtService.signAsync(payload);
    
    // Refresh token rotation
    const family = crypto.randomUUID();
    const refreshToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        family,
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
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: oldToken },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException();
    }

    if (tokenRecord.revoked) {
      // Refresh token reuse detected! Revoke whole family.
      await this.prisma.refreshToken.updateMany({
        where: { family: tokenRecord.family },
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
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        family: tokenRecord.family,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  }
}
