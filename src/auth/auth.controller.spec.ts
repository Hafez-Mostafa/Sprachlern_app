import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: any;

  beforeEach(async () => {
    service = { login: jest.fn(), adminLogin: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('login() delegiert an authService.login()', async () => {
    const dto = { email: 'a@b.com', password: 'geheim123' };
    await controller.login(dto);
    expect(service.login).toHaveBeenCalledWith(dto);
  });

  it('adminLogin() delegiert an authService.adminLogin(), getrennt von login()', async () => {
    const dto = { email: 'admin@b.com', password: 'geheim123' };
    await controller.adminLogin(dto);
    expect(service.adminLogin).toHaveBeenCalledWith(dto);
    expect(service.login).not.toHaveBeenCalled();
  });
});
