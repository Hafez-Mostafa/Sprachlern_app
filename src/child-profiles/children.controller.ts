import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ChildProfilesService } from './child-profiles.service';
import { UpdateChildProfileDto } from './dto/update-child-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('children')
export class ChildrenController {
  constructor(private readonly childProfilesService: ChildProfilesService) {}

  @Get(':childId')
  findOne(@Param('childId') childId: string, @Req() req: Request) {
    const user = req.user as { guardian_id: string };
    return this.childProfilesService.findOne(childId, user.guardian_id);
  }

  @Patch(':childId')
  update(
    @Param('childId') childId: string,
    @Req() req: Request,
    @Body() dto: UpdateChildProfileDto,
  ) {
    const user = req.user as { guardian_id: string };
    return this.childProfilesService.update(childId, user.guardian_id, dto);
  }

  @Delete(':childId')
  remove(@Param('childId') childId: string, @Req() req: Request) {
    const user = req.user as { guardian_id: string };
    return this.childProfilesService.remove(childId, user.guardian_id);
  }
}
