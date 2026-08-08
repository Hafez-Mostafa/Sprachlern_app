import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChildProfileDto } from './dto/create-child-profile.dto';
import { UpdateChildProfileDto } from './dto/update-child-profile.dto';

@Injectable()
export class ChildProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(guardianId: string, dto: CreateChildProfileDto) {
    return this.prisma.child_profiles.create({
      data: {
        guardian_id: guardianId,
        nickname: dto.nickname,
        avatar: dto.avatar,
        language_id: dto.language_id,
      },
    });
  }

  async findAllForGuardian(guardianId: string) {
    return this.prisma.child_profiles.findMany({
      where: { guardian_id: guardianId },
    });
  }

  async findOne(childId: string, guardianId: string) {
    const child = await this.prisma.child_profiles.findUnique({
      where: { child_id: childId },
    });

    if (!child) {
      throw new NotFoundException(
        `Kinderprofil mit ID ${childId} nicht gefunden`,
      );
    }

    if (child.guardian_id !== guardianId) {
      throw new ForbiddenException('Kein Zugriff auf dieses Kinderprofil');
    }

    return child;
  }

  async update(
    childId: string,
    guardianId: string,
    dto: UpdateChildProfileDto,
  ) {
    await this.findOne(childId, guardianId);

    return this.prisma.child_profiles.update({
      where: { child_id: childId },
      data: {
        ...dto,
        updated_at: new Date(),
      },
    });
  }

  async remove(childId: string, guardianId: string) {
    await this.findOne(childId, guardianId);

    await this.prisma.child_profiles.delete({ where: { child_id: childId } });
    return { message: 'Kinderprofil gelöscht' };
  }
}
