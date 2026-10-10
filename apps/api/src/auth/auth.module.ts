import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'secret', // Use env in prod
      signOptions: { expiresIn: '15m' }, // Short lived access token
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
