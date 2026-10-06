import { Controller, Get, Param, Put, Body, Req } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { UpdateProgressDto } from '@gdgoc/contracts';
import { Request } from 'express';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  getAllProgress(@Req() req: Request) {
    return this.progressService.getAllProgress((req as any).user.sub);
  }

  @Get(':tutorialId')
  getProgress(@Req() req: Request, @Param('tutorialId') tutorialId: string) {
    return this.progressService.getProgress((req as any).user.sub, tutorialId);
  }

  @Put(':tutorialId')
  updateProgress(
    @Req() req: Request,
    @Param('tutorialId') tutorialId: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    return this.progressService.updateProgress((req as any).user.sub, tutorialId, updateProgressDto);
  }
}
