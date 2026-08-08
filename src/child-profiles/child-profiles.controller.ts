import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ChildProfilesService } from './child-profiles.service';
import { CreateChildProfileDto } from './dto/create-child-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('guardians/me/children')
export class ChildProfilesController {
  constructor(private readonly childProfilesService: ChildProfilesService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateChildProfileDto) {
    const user = req.user as { guardian_id: string };
    return this.childProfilesService.create(user.guardian_id, dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { guardian_id: string };
    return this.childProfilesService.findAllForGuardian(user.guardian_id);
  }
}
