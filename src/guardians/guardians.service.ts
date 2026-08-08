import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';

@Injectable()
export class GuardiansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createGuardianDto: CreateGuardianDto) {
    const { email, password } = createGuardianDto;

    const existing = await this.prisma.guardians.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('E-Mail bereits registriert');
    }

    const password_hash = await bcrypt.hash(password, 10);

    const guardian = await this.prisma.guardians.create({
      data: { email, password_hash },
    });

    const { password_hash: _, ...result } = guardian;
    return result;
  }

  async findOne(id: string) {
    const guardian = await this.prisma.guardians.findUnique({
      where: { guardian_id: id },
    });
    if (!guardian) {
      throw new NotFoundException(
        `Sorgeberechtigte:r mit ID ${id} nicht gefunden`,
      );
    }
    const { password_hash, ...result } = guardian;
    return result;
  }

  async update(id: string, updateGuardianDto: UpdateGuardianDto) {
    await this.findOne(id);

    const data: { email?: string; password_hash?: string } = {};
    if (updateGuardianDto.email) {
      data.email = updateGuardianDto.email;
    }
    if (updateGuardianDto.password) {
      data.password_hash = await bcrypt.hash(updateGuardianDto.password, 10);
    }

    const guardian = await this.prisma.guardians.update({
      where: { guardian_id: id },
      data,
    });
    const { password_hash, ...result } = guardian;
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.guardians.delete({ where: { guardian_id: id } });
    return { message: 'Konto gelöscht' };
  }
}
