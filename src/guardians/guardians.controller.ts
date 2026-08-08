import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { GuardiansService } from './guardians.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('guardians')
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Post()
  create(@Body() createGuardianDto: CreateGuardianDto) {
    return this.guardiansService.create(createGuardianDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: Request) {
    const user = req.user as { guardian_id: string };
    return this.guardiansService.findOne(user.guardian_id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Req() req: Request, @Body() updateGuardianDto: UpdateGuardianDto) {
    const user = req.user as { guardian_id: string };
    return this.guardiansService.update(user.guardian_id, updateGuardianDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  removeMe(@Req() req: Request) {
    const user = req.user as { guardian_id: string };
    return this.guardiansService.remove(user.guardian_id);
  }
}
