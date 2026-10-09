import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class OriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method.toUpperCase();

    // Only inspect mutating methods (CSRF mitigation)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const originHeader = req.headers['origin'];
      if (originHeader) {
        let originHost: string;
        try {
          originHost = new URL(originHeader).host;
        } catch {
          throw new ForbiddenException('Invalid Origin header format');
        }

        const reqHost = req.headers['host'];
        const frontendUrl = process.env.FRONTEND_URL;
        let frontendHost = '';
        if (frontendUrl) {
          try {
            frontendHost = new URL(frontendUrl).host;
          } catch {}
        }

        const isSameHost = reqHost && originHost === reqHost;
        const isFrontendHost = frontendHost && originHost === frontendHost;
        const isLocalDev = ['localhost:3000', '127.0.0.1:3000', 'localhost:5500', '127.0.0.1:5500'].includes(originHost);

        if (!isSameHost && !isFrontendHost && !isLocalDev) {
          throw new ForbiddenException('Cross-origin mutation forbidden');
        }
      }
    }

    return true;
  }
}

