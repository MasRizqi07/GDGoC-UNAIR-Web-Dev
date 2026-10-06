import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('TodosController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userAToken: string;
  let userBToken: string;
  let userATodoId: string;

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

    // Register user A
    const regA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('x-forwarded-for', '1.2.3.99')
      .send({ email: 'usera@example.com', password: 'password123' });
    expect(regA.status).toBe(201);
    
    const resA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('x-forwarded-for', '1.2.3.99')
      .send({ email: 'usera@example.com', password: 'password123' });
    
    expect(resA.status).toBe(201);
    expect(resA.headers['set-cookie']).toBeDefined();
    userAToken = resA.headers['set-cookie'].find((c: string) => c.startsWith('access_token=')).split(';')[0];

    // Register user B
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('x-forwarded-for', '1.2.3.99')
      .send({ email: 'userb@example.com', password: 'password123' });
    
    const resB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('x-forwarded-for', '1.2.3.99')
      .send({ email: 'userb@example.com', password: 'password123' });
      
    expect(resB.status).toBe(201);
    expect(resB.headers['set-cookie']).toBeDefined();
    userBToken = resB.headers['set-cookie'].find((c: string) => c.startsWith('access_token=')).split(';')[0];

    // User A creates a todo
    const todoRes = await request(app.getHttpServer())
      .post('/api/v1/todos')
      .set('Cookie', userAToken)
      .send({ text: 'User A task' });
    userATodoId = todoRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/todos/:id should return 404 if User B tries to read User A todo', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/todos/${userATodoId}`)
      .set('Cookie', userBToken);
    expect(res.status).toBe(404);
  });

  it('PUT /api/v1/todos/:id should return 404 if User B tries to update User A todo', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/v1/todos/${userATodoId}`)
      .set('Cookie', userBToken)
      .send({ text: 'Hacked task' });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/v1/todos/:id should return 404 if User B tries to delete User A todo', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/v1/todos/${userATodoId}`)
      .set('Cookie', userBToken);
    expect(res.status).toBe(404);
  });
});
