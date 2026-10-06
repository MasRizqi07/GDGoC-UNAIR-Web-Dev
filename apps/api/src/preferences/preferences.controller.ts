import { Controller, Get, Put, Body, Req } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { UpdatePreferenceDto } from '@gdgoc/contracts';
import { Request } from 'express';

@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  getPreferences(@Req() req: Request) {
    return this.preferencesService.getPreferences((req as any).user.sub);
  }

  @Put()
  updatePreferences(@Req() req: Request, @Body() updatePreferenceDto: UpdatePreferenceDto) {
    return this.preferencesService.updatePreferences((req as any).user.sub, updatePreferenceDto);
  }
}
