import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AuthGuard } from './auth/auth.guard.js';
import { TodosModule } from './todos/todos.module.js';
import { PreferencesModule } from './preferences/preferences.module.js';
import { ProgressModule } from './progress/progress.module.js';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { assertValidEnv } from './common/env.validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { OriginGuard } from './common/guards/origin.guard.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'web', 'dist'),
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    TodosModule,
    PreferencesModule,
    ProgressModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: OriginGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    }
  ],
})
export class AppModule {
  constructor() {
    assertValidEnv();
  }
}
