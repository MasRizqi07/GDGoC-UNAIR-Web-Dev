import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';


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
      expect(appController.health()).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
      });
    });

    it('should return ready status', async () => {
      const res = await appController.ready();
      expect(res).toEqual({
        status: 'ready',
        timestamp: expect.any(String),
      });
    });
  });
});
