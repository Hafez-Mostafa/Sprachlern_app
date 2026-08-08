import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const admin = await this.prisma.admins.findUnique({
      where: { admin_id: id },
    });
    if (!admin) {
      throw new NotFoundException(`Admin mit ID ${id} nicht gefunden`);
    }
    const { password_hash, ...result } = admin;
    return result;
  }
}
