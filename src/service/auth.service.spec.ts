import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { SysUser } from '../domain/entities/sys-user.entity';
import { BcryptUtil } from '../common/utils/bcrypt.util';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUser: Partial<SysUser> = {
    userId: 1,
    userName: 'admin',
    nickName: '管理员',
    password: '$2b$10$hashedPassword', // 模拟加密后的密码
    status: '0',
    delFlag: '0',
    deptId: 100,
    roles: [
      { roleId: 1, roleName: '超级管理员', roleKey: 'admin' } as any,
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            selectUserByUserName: jest.fn(),
            selectUserById: jest.fn(),
            updateLoginInfo: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(userService, 'selectUserByUserName').mockResolvedValue(null);

      await expect(service.login('admin', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login('admin', 'password')).rejects.toThrow(
        '用户名或密码错误',
      );
    });

    it('should throw UnauthorizedException if user is disabled', async () => {
      jest.spyOn(userService, 'selectUserByUserName').mockResolvedValue({
        ...mockUser,
        status: '1',
      } as SysUser);

      await expect(service.login('admin', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login('admin', 'password')).rejects.toThrow(
        '用户已被停用',
      );
    });

    it('should throw UnauthorizedException if user is deleted', async () => {
      jest.spyOn(userService, 'selectUserByUserName').mockResolvedValue({
        ...mockUser,
        delFlag: '2',
      } as SysUser);

      await expect(service.login('admin', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login('admin', 'password')).rejects.toThrow(
        '用户已被删除',
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      jest.spyOn(userService, 'selectUserByUserName').mockResolvedValue(mockUser as SysUser);
      jest.spyOn(BcryptUtil, 'comparePassword').mockResolvedValue(false);

      await expect(service.login('admin', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login('admin', 'wrongpassword')).rejects.toThrow(
        '用户名或密码错误',
      );
    });

    it('should return token and user info on successful login', async () => {
      jest.spyOn(userService, 'selectUserByUserName').mockResolvedValue(mockUser as SysUser);
      jest.spyOn(BcryptUtil, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(userService, 'updateLoginInfo').mockResolvedValue(undefined);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock_token');

      const result = await service.login('admin', 'admin123');

      expect(result).toHaveProperty('accessToken', 'mock_token');
      expect(result).toHaveProperty('tokenType', 'Bearer');
      expect(result).toHaveProperty('expiresIn');
      expect(result).toHaveProperty('user');
      expect(result.user.userId).toBe(1);
      expect(userService.updateLoginInfo).toHaveBeenCalled();
    });
  });

  describe('getUserInfo', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(userService, 'selectUserById').mockResolvedValue(null);

      await expect(service.getUserInfo(999)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.getUserInfo(999)).rejects.toThrow('用户不存在');
    });

    it('should return user info', async () => {
      jest.spyOn(userService, 'selectUserById').mockResolvedValue(mockUser as SysUser);

      const result = await service.getUserInfo(1);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('roles');
      expect(result).toHaveProperty('permissions');
      expect(result.user.userId).toBe(1);
    });
  });

  describe('logout', () => {
    it('should return true on logout', async () => {
      const result = await service.logout(1);

      expect(result).toBe(true);
    });
  });
});

