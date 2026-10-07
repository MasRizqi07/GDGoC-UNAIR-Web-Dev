import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let _refreshToken: string;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.use(require('cookie-parser')());
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.todo.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
    
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
  });

  describe('/api/v1/auth', () => {
    it('POST /register should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register').set('x-forwarded-for', '1.2.3.18')
        .send({ email: 'test@example.com', password: 'password123' });
      
      expect(res.status).toBe(201);
      expect(res.body.email).toBe('test@example.com');
      expect(res.body.passwordHash).toBeUndefined();
      expect(res.body.password).toBeUndefined();
    });

    it('POST /register should return generic response for duplicate email including casing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register').set('x-forwarded-for', '1.2.3.89')
        .send({ email: 'dup@example.com', password: 'password123' });
      
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register').set('x-forwarded-for', '1.2.3.16')
        .send({ email: 'DUP@example.com', password: 'password123' });
      
      expect(res.status).toBe(400); // Generic response
    });

    it('POST /login should login and set cookies', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register').set('x-forwarded-for', '1.2.3.14')
        .send({ email: 'login@example.com', password: 'password123' });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login').set('x-forwarded-for', '1.2.3.52')
        .send({ email: 'login@example.com', password: 'password123' });
      
      expect(res.status).toBe(201);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('POST /login should ratelimit 6th rapid login', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register').set('x-forwarded-for', '1.2.3.94')
        .send({ email: 'rate@example.com', password: 'password123' });

      // 5 attempts
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login').set('x-forwarded-for', '1.2.3.23')
          .send({ email: 'rate@example.com', password: 'password123' });
      }
      
      // 6th attempt
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login').set('x-forwarded-for', '1.2.3.23')
        .send({ email: 'rate@example.com', password: 'password123' });
      
      expect(res.status).toBe(429);
    });
    
    it('POST /refresh should rotate token and detect reuse', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register').set('x-forwarded-for', '1.2.3.39')
        .send({ email: 'rot@example.com', password: 'password123' });

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login').set('x-forwarded-for', '1.2.3.101')
        .send({ email: 'rot@example.com', password: 'password123' });
      const currentRefresh = (loginRes.headers['set-cookie']! as unknown as string[]).find((c: string) => c.startsWith('refresh_token='))!.split(';')[0];

      // First refresh should work
      const res1 = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', currentRefresh);
      expect(res1.status).toBe(201);
      const newRefresh = (res1.headers['set-cookie']! as unknown as string[]).find((c: string) => c.startsWith('refresh_token='))!.split(';')[0];
      
      // Attempt to reuse old refresh token should return 401
      const res2 = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', currentRefresh);
      expect(res2.status).toBe(401);
      expect(res2.body.message).toBe('Token reuse detected');
      
      // Next refresh with the valid token should now be 401 because the family was revoked
      const res3 = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', newRefresh);
      expect(res3.status).toBe(401);
    });

    it('POST /logout should revoke the family', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register').set('x-forwarded-for', '1.2.3.40')
        .send({ email: 'logout@example.com', password: 'password123' });

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login').set('x-forwarded-for', '1.2.3.41')
        .send({ email: 'logout@example.com', password: 'password123' });
      const currentRefresh = (loginRes.headers['set-cookie']! as unknown as string[]).find((c: string) => c.startsWith('refresh_token='))!.split(';')[0];

      const logoutRes = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', currentRefresh);
      expect(logoutRes.status).toBe(201); // or 200/204

      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', currentRefresh);
      expect(refreshRes.status).toBe(401);
    });

    it('GET /me should return 204 without token', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/auth/me');
      expect(res.status).toBe(204);
    });

    it('GET /me should return 204 with bad token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', 'access_token=badtoken');
      expect(res.status).toBe(204);
    });

    it('DELETE /api/v1/auth/me removes every row of the user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register').set('x-forwarded-for', '1.2.3.42')
        .send({ email: 'delete@example.com', password: 'password123' });

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login').set('x-forwarded-for', '1.2.3.43')
        .send({ email: 'delete@example.com', password: 'password123' });
      const accessToken = (loginRes.headers['set-cookie']! as unknown as string[]).find((c: string) => c.startsWith('access_token='))!.split(';')[0];

      await request(app.getHttpServer())
        .post('/api/v1/todos')
        .set('Cookie', accessToken)
        .send({ text: 'To be deleted' });

      const beforeUserCount = await prisma.user.count();
      const beforeTodoCount = await prisma.todo.count();
      const beforeTokenCount = await prisma.refreshToken.count();
      
      const delRes = await request(app.getHttpServer())
        .delete('/api/v1/auth/me')
        .set('Cookie', accessToken);
      expect(delRes.status).toBe(200);

      expect(await prisma.user.count()).toBe(beforeUserCount - 1);
      expect(await prisma.todo.count()).toBe(beforeTodoCount - 1);
      expect(await prisma.refreshToken.count()).toBe(beforeTokenCount - 2);
    });
  });
});
