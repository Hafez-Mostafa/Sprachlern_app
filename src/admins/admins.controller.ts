import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminsService } from './admins.service';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@UseGuards(AdminJwtGuard)
@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get('me')
  getMe(@Req() req: Request) {
    const user = req.user as { admin_id: string };
    return this.adminsService.findOne(user.admin_id);
  }
}
