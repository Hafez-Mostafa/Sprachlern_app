import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

const adminJwtSecret = process.env.ADMIN_JWT_SECRET || 'development-admin-jwt-secret';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: adminJwtSecret,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    return { admin_id: payload.sub, email: payload.email };
  }
}
