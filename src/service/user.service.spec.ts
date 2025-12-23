import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from '../mapper/user.repository';
import { UserRoleRepository } from '../mapper/user-role.repository';
import { UserPostRepository } from '../mapper/user-post.repository';
import { DataSource } from 'typeorm';
import { SysUser } from '../domain/entities/sys-user.entity';

describe('UserService', () => {
  let service: UserService;
  let userRepository: UserRepository;
  let userRoleRepository: UserRoleRepository;
  let userPostRepository: UserPostRepository;

  const mockUser: Partial<SysUser> = {
    userId: 1,
    userName: 'test',
    nickName: '测试用户',
    email: 'test@example.com',
    phonenumber: '13800138000',
    status: '0',
    delFlag: '0',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            selectUserList: jest.fn(),
            selectUserByUserName: jest.fn(),
            selectUserById: jest.fn(),
            insertUser: jest.fn(),
            updateUser: jest.fn(),
            deleteUserById: jest.fn(),
            deleteUserByIds: jest.fn(),
            checkUserNameUnique: jest.fn(),
            checkPhoneUnique: jest.fn(),
            checkEmailUnique: jest.fn(),
            updateUserStatus: jest.fn(),
            updateUserAvatar: jest.fn(),
            updateLoginInfo: jest.fn(),
            resetUserPwd: jest.fn(),
          },
        },
        {
          provide: UserRoleRepository,
          useValue: {
            deleteUserRoleByUserId: jest.fn(),
            batchUserRole: jest.fn(),
            deleteUserRole: jest.fn(),
          },
        },
        {
          provide: UserPostRepository,
          useValue: {
            deleteUserPostByUserId: jest.fn(),
            batchUserPost: jest.fn(),
            deleteUserPost: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((callback) => callback()),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    userRoleRepository = module.get<UserRoleRepository>(UserRoleRepository);
    userPostRepository = module.get<UserPostRepository>(UserPostRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkUserNameUnique', () => {
    it('should return true if username is unique', async () => {
      jest.spyOn(userRepository, 'checkUserNameUnique').mockResolvedValue(null);
      
      const result = await service.checkUserNameUnique({ userName: 'newuser' });
      
      expect(result).toBe(true);
      expect(userRepository.checkUserNameUnique).toHaveBeenCalledWith('newuser');
    });

    it('should return false if username exists with different userId', async () => {
      jest.spyOn(userRepository, 'checkUserNameUnique').mockResolvedValue(mockUser as SysUser);
      
      const result = await service.checkUserNameUnique({ userId: 2, userName: 'test' });
      
      expect(result).toBe(false);
    });

    it('should return true if username exists with same userId', async () => {
      jest.spyOn(userRepository, 'checkUserNameUnique').mockResolvedValue(mockUser as SysUser);
      
      const result = await service.checkUserNameUnique({ userId: 1, userName: 'test' });
      
      expect(result).toBe(true);
    });
  });

  describe('checkPhoneUnique', () => {
    it('should return true if phone is unique', async () => {
      jest.spyOn(userRepository, 'checkPhoneUnique').mockResolvedValue(null);
      
      const result = await service.checkPhoneUnique({ phonenumber: '13900139000' });
      
      expect(result).toBe(true);
    });

    it('should return false if phone exists', async () => {
      jest.spyOn(userRepository, 'checkPhoneUnique').mockResolvedValue(mockUser as SysUser);
      
      const result = await service.checkPhoneUnique({ userId: 2, phonenumber: '13800138000' });
      
      expect(result).toBe(false);
    });
  });

  describe('checkEmailUnique', () => {
    it('should return true if email is unique', async () => {
      jest.spyOn(userRepository, 'checkEmailUnique').mockResolvedValue(null);
      
      const result = await service.checkEmailUnique({ email: 'new@example.com' });
      
      expect(result).toBe(true);
    });

    it('should return false if email exists', async () => {
      jest.spyOn(userRepository, 'checkEmailUnique').mockResolvedValue(mockUser as SysUser);
      
      const result = await service.checkEmailUnique({ userId: 2, email: 'test@example.com' });
      
      expect(result).toBe(false);
    });
  });

  describe('selectUserById', () => {
    it('should return user by id', async () => {
      jest.spyOn(userRepository, 'selectUserById').mockResolvedValue(mockUser as SysUser);
      
      const result = await service.selectUserById(1);
      
      expect(result).toEqual(mockUser);
      expect(userRepository.selectUserById).toHaveBeenCalledWith(1);
    });

    it('should return null if user not found', async () => {
      jest.spyOn(userRepository, 'selectUserById').mockResolvedValue(null);
      
      const result = await service.selectUserById(999);
      
      expect(result).toBeNull();
    });
  });

  describe('selectUserByUserName', () => {
    it('should return user by username', async () => {
      jest.spyOn(userRepository, 'selectUserByUserName').mockResolvedValue(mockUser as SysUser);
      
      const result = await service.selectUserByUserName('test');
      
      expect(result).toEqual(mockUser);
      expect(userRepository.selectUserByUserName).toHaveBeenCalledWith('test');
    });
  });

  describe('checkUserAllowed', () => {
    it('should not throw error for non-admin user', () => {
      expect(() => service.checkUserAllowed({ userId: 2 })).not.toThrow();
    });

    it('should throw error for admin user', () => {
      expect(() => service.checkUserAllowed({ userId: 1 })).toThrow('不允许操作超级管理员用户');
    });
  });
});

