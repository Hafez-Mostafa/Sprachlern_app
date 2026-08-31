import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

const adminJwtSecret = process.env.ADMIN_JWT_SECRET || 'development-admin-jwt-secret';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const guardian = await this.prisma.guardians.findUnique({
      where: { email },
    });
    if (!guardian) {
      throw new UnauthorizedException('Ungültige Zugangsdaten');
    }

    const passwordMatches = await bcrypt.compare(
      password,
      guardian.password_hash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Ungültige Zugangsdaten');
    }

    const payload = { sub: guardian.guardian_id, email: guardian.email };
    const access_token = await this.jwtService.signAsync(payload);

    const { password_hash, ...guardianWithoutHash } = guardian;
    return {
      access_token,
      token_type: 'Bearer',
      guardian: guardianWithoutHash,
    };
  }

  // Eigenständiger Login für Admins — signiert mit ADMIN_JWT_SECRET,
  // dadurch komplett getrennt von Guardian-Tokens.
  async adminLogin(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const admin = await this.prisma.admins.findUnique({ where: { email } });
    if (!admin) {
      throw new UnauthorizedException('Ungültige Zugangsdaten');
    }

    const passwordMatches = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Ungültige Zugangsdaten');
    }

    const payload = { sub: admin.admin_id, email: admin.email };
    const access_token = await this.jwtService.signAsync(payload, {
      secret: adminJwtSecret,
    });

    const { password_hash, ...adminWithoutHash } = admin;
    return { access_token, token_type: 'Bearer', admin: adminWithoutHash };
  }
}
