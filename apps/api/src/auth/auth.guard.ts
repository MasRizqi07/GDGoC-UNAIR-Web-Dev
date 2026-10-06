import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromCookie(request) || this.extractTokenFromHeader(request);
    
    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync(token);
        request['user'] = payload;
      } catch {
        // invalid token, just leave user undefined
      }
    }

    if (!isPublic && !request['user']) {
      throw new UnauthorizedException();
    }
    
    return true;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    return request.cookies?.['access_token'];
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
