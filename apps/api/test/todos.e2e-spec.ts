import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

function checkNoSecrets(obj: any) {
  if (!obj || typeof obj !== 'object') return;
  expect(obj.password).toBeUndefined();
  expect(obj.passwordHash).toBeUndefined();
  expect(obj.tokenHash).toBeUndefined();
  for (const key of Object.keys(obj)) {
    checkNoSecrets(obj[key]);
  }
}

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
    userAToken = (resA.headers['set-cookie'] as unknown as string[]).find((c: string) => c.startsWith('access_token='))!.split(';')[0];

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
    userBToken = (resB.headers['set-cookie'] as unknown as string[]).find((c: string) => c.startsWith('access_token='))!.split(';')[0];

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

  it('PUT /api/v1/todos/reorder should return 404 if User B tries to reorder User A todo', async () => {
    const res = await request(app.getHttpServer())
      .put('/api/v1/todos/reorder')
      .set('Cookie', userBToken)
      .send({ todoIds: [userATodoId] });
    expect(res.status).toBe(404);
  });

  it('GET /api/v1/todos should return 401 without token', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/todos');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/todos should return todos without secrets', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/todos')
      .set('Cookie', userAToken);
    expect(res.status).toBe(200);
    checkNoSecrets(res.body);
  });

  it('GET /api/v1/todos should return 401 with bad token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/todos')
      .set('Cookie', 'access_token=garbage');
    expect(res.status).toBe(401);
  });

  it('PUT /api/v1/todos/reorder should update positions of todos', async () => {
    // Create another todo for user A
    const todo2Res = await request(app.getHttpServer())
      .post('/api/v1/todos')
      .set('Cookie', userAToken)
      .send({ text: 'User A task 2' });
    const todo2Id = todo2Res.body.id;

    // Reorder: put todo2 before userATodoId
    const res = await request(app.getHttpServer())
      .put('/api/v1/todos/reorder')
      .set('Cookie', userAToken)
      .send({ todoIds: [todo2Id, userATodoId] });
    
    expect(res.status).toBe(200);
    const updatedTodos = res.body;
    expect(updatedTodos.find((t: any) => t.id === todo2Id).position).toBe(0);
    expect(updatedTodos.find((t: any) => t.id === userATodoId).position).toBe(1);
    checkNoSecrets(res.body);
  });
});
