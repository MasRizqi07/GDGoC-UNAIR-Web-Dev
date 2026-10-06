import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    this.logger.log(`Health check requested`);
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async ready() {
    this.logger.log(`Ready check requested`);
    // Placeholder for DB check
    return { status: 'ready', timestamp: new Date().toISOString() };
  }
}
