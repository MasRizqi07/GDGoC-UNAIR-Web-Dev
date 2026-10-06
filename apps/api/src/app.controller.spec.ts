import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { Request } from 'express';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return health status', () => {
      const mockReq = {} as Request;
      expect(appController.health(mockReq)).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
      });
    });

    it('should return ready status', async () => {
      const mockReq = {} as Request;
      const res = await appController.ready(mockReq);
      expect(res).toEqual({
        status: 'ready',
        timestamp: expect.any(String),
      });
    });
  });
});
