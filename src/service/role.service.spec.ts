import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleRepository } from '../mapper/role.repository';
import { RoleMenuRepository } from '../mapper/role-menu.repository';
import { RoleDeptRepository } from '../mapper/role-dept.repository';
import { UserRoleRepository } from '../mapper/user-role.repository';
import { SysRole } from '../domain/entities/sys-role.entity';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepository: jest.Mocked<RoleRepository>;
  let roleMenuRepository: jest.Mocked<RoleMenuRepository>;
  let roleDeptRepository: jest.Mocked<RoleDeptRepository>;
  let userRoleRepository: jest.Mocked<UserRoleRepository>;

  beforeEach(async () => {
    // 创建 mock 对象
    const mockRoleRepository = {
      selectRoleList: jest.fn(),
      selectRolePermissionByUserId: jest.fn(),
      selectRoleAll: jest.fn(),
      selectRoleListByUserId: jest.fn(),
      selectRoleById: jest.fn(),
      checkRoleNameUnique: jest.fn(),
      checkRoleKeyUnique: jest.fn(),
      updateRole: jest.fn(),
      insertRole: jest.fn(),
      deleteRoleById: jest.fn(),
      deleteRoleByIds: jest.fn(),
    };

    const mockRoleMenuRepository = {
      deleteRoleMenuByRoleId: jest.fn(),
      batchRoleMenu: jest.fn(),
      deleteRoleMenu: jest.fn(),
    };

    const mockRoleDeptRepository = {
      deleteRoleDeptByRoleId: jest.fn(),
      batchRoleDept: jest.fn(),
      deleteRoleDept: jest.fn(),
    };

    const mockUserRoleRepository = {
      countUserRoleByRoleId: jest.fn(),
      deleteUserRoleInfo: jest.fn(),
      deleteUserRoleInfos: jest.fn(),
      batchInsertUserRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: RoleRepository,
          useValue: mockRoleRepository,
        },
        {
          provide: RoleMenuRepository,
          useValue: mockRoleMenuRepository,
        },
        {
          provide: RoleDeptRepository,
          useValue: mockRoleDeptRepository,
        },
        {
          provide: UserRoleRepository,
          useValue: mockUserRoleRepository,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    roleRepository = module.get(RoleRepository);
    roleMenuRepository = module.get(RoleMenuRepository);
    roleDeptRepository = module.get(RoleDeptRepository);
    userRoleRepository = module.get(UserRoleRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('selectRoleList', () => {
    it('应该返回角色列表', async () => {
      const mockRoles: SysRole[] = [
        { roleId: 1, roleName: '超级管理员', roleKey: 'admin' } as SysRole,
        { roleId: 2, roleName: '普通角色', roleKey: 'common' } as SysRole,
      ];
      roleRepository.selectRoleList.mockResolvedValue([mockRoles, 2]);

      const result = await service.selectRoleList({});

      expect(result).toEqual([mockRoles, 2]);
      expect(roleRepository.selectRoleList).toHaveBeenCalledWith({});
    });
  });

  describe('selectRolesByUserId', () => {
    it('应该返回标记了用户已分配角色的列表', async () => {
      const userRoles: SysRole[] = [
        { roleId: 2, roleName: '普通角色', roleKey: 'common' } as SysRole,
      ];
      const allRoles: SysRole[] = [
        { roleId: 1, roleName: '超级管理员', roleKey: 'admin' } as SysRole,
        { roleId: 2, roleName: '普通角色', roleKey: 'common' } as SysRole,
      ];

      roleRepository.selectRolePermissionByUserId.mockResolvedValue(userRoles);
      roleRepository.selectRoleList.mockResolvedValue([allRoles, 2]);

      const result = await service.selectRolesByUserId(1);

      expect(result).toHaveLength(2);
      expect((result[1] as any).flag).toBe(true); // 第二个角色应该被标记
      expect((result[0] as any).flag).toBeUndefined(); // 第一个角色不应该被标记
    });
  });

  describe('selectRolePermissionByUserId', () => {
    it('应该返回用户的角色权限字符集合', async () => {
      const roles: SysRole[] = [
        { roleId: 1, roleKey: 'admin' } as SysRole,
        { roleId: 2, roleKey: 'common,user' } as SysRole,
      ];
      roleRepository.selectRolePermissionByUserId.mockResolvedValue(roles);

      const result = await service.selectRolePermissionByUserId(1);

      expect(result).toEqual(new Set(['admin', 'common', 'user']));
    });

    it('应该正确处理逗号分隔的权限字符', async () => {
      const roles: SysRole[] = [
        { roleId: 1, roleKey: 'role1,role2,role3' } as SysRole,
      ];
      roleRepository.selectRolePermissionByUserId.mockResolvedValue(roles);

      const result = await service.selectRolePermissionByUserId(1);

      expect(result.size).toBe(3);
      expect(result.has('role1')).toBe(true);
      expect(result.has('role2')).toBe(true);
      expect(result.has('role3')).toBe(true);
    });
  });

  describe('checkRoleNameUnique', () => {
    it('应该返回 true 当角色名称不存在时', async () => {
      roleRepository.checkRoleNameUnique.mockResolvedValue(null);

      const result = await service.checkRoleNameUnique({
        roleName: '新角色',
      });

      expect(result).toBe(true);
    });

    it('应该返回 false 当角色名称已存在时', async () => {
      const existingRole = { roleId: 1, roleName: '已存在角色' } as SysRole;
      roleRepository.checkRoleNameUnique.mockResolvedValue(existingRole);

      const result = await service.checkRoleNameUnique({
        roleId: 2,
        roleName: '已存在角色',
      });

      expect(result).toBe(false);
    });

    it('应该返回 true 当修改自己的角色名称时', async () => {
      const existingRole = { roleId: 1, roleName: '角色名' } as SysRole;
      roleRepository.checkRoleNameUnique.mockResolvedValue(existingRole);

      const result = await service.checkRoleNameUnique({
        roleId: 1,
        roleName: '角色名',
      });

      expect(result).toBe(true);
    });
  });

  describe('checkRoleKeyUnique', () => {
    it('应该返回 true 当角色权限字符不存在时', async () => {
      roleRepository.checkRoleKeyUnique.mockResolvedValue(null);

      const result = await service.checkRoleKeyUnique({
        roleKey: 'new_role',
      });

      expect(result).toBe(true);
    });

    it('应该返回 false 当角色权限字符已存在时', async () => {
      const existingRole = { roleId: 1, roleKey: 'admin' } as SysRole;
      roleRepository.checkRoleKeyUnique.mockResolvedValue(existingRole);

      const result = await service.checkRoleKeyUnique({
        roleId: 2,
        roleKey: 'admin',
      });

      expect(result).toBe(false);
    });
  });

  describe('checkRoleAllowed', () => {
    it('应该抛出异常当操作超级管理员角色时', () => {
      expect(() => {
        service.checkRoleAllowed({ roleId: 1 });
      }).toThrow(ForbiddenException);
      expect(() => {
        service.checkRoleAllowed({ roleId: 1 });
      }).toThrow('不允许操作超级管理员角色');
    });

    it('应该不抛出异常当操作普通角色时', () => {
      expect(() => {
        service.checkRoleAllowed({ roleId: 2 });
      }).not.toThrow();
    });
  });

  describe('insertRole', () => {
    it('应该成功新增角色并关联菜单', async () => {
      const newRole = {
        roleName: '测试角色',
        roleKey: 'test',
        roleSort: 1,
        status: '0',
        menuIds: [1, 2, 3],
      } as SysRole;

      const savedRole = { ...newRole, roleId: 10 } as SysRole;
      roleRepository.insertRole.mockResolvedValue(savedRole);
      roleMenuRepository.batchRoleMenu.mockResolvedValue(3);

      const result = await service.insertRole(newRole);

      expect(result).toBe(1);
      expect(roleRepository.insertRole).toHaveBeenCalledWith(newRole);
      expect(roleMenuRepository.batchRoleMenu).toHaveBeenCalled();
    });

    it('应该成功新增角色（无菜单）', async () => {
      const newRole = {
        roleName: '测试角色',
        roleKey: 'test',
        roleSort: 1,
        status: '0',
      } as SysRole;

      const savedRole = { ...newRole, roleId: 10 } as SysRole;
      roleRepository.insertRole.mockResolvedValue(savedRole);

      const result = await service.insertRole(newRole);

      expect(result).toBe(1);
      expect(roleMenuRepository.batchRoleMenu).not.toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    it('应该成功修改角色并更新菜单关联', async () => {
      const updateRole = {
        roleId: 2,
        roleName: '修改后的角色',
        roleKey: 'updated',
        roleSort: 2,
        status: '0',
        menuIds: [1, 2],
      } as Partial<SysRole>;

      roleRepository.updateRole.mockResolvedValue(1);
      roleMenuRepository.deleteRoleMenuByRoleId.mockResolvedValue(1);
      roleMenuRepository.batchRoleMenu.mockResolvedValue(2);

      const result = await service.updateRole(updateRole);

      expect(result).toBe(1);
      expect(roleRepository.updateRole).toHaveBeenCalledWith(updateRole);
      expect(roleMenuRepository.deleteRoleMenuByRoleId).toHaveBeenCalledWith(2);
      expect(roleMenuRepository.batchRoleMenu).toHaveBeenCalled();
    });
  });

  describe('deleteRoleByIds', () => {
    it('应该成功删除角色', async () => {
      const roleIds = [10];
      const role = { roleId: 10, roleName: '测试角色' } as SysRole;

      roleRepository.selectRoleById.mockResolvedValue(role);
      userRoleRepository.countUserRoleByRoleId.mockResolvedValue(0);
      roleMenuRepository.deleteRoleMenu.mockResolvedValue(1);
      roleDeptRepository.deleteRoleDept.mockResolvedValue(1);
      roleRepository.deleteRoleByIds.mockResolvedValue(1);

      const result = await service.deleteRoleByIds(roleIds);

      expect(result).toBe(1);
      expect(roleRepository.deleteRoleByIds).toHaveBeenCalledWith(roleIds);
    });

    it('应该拒绝删除超级管理员角色', async () => {
      const roleIds = [1];

      await expect(service.deleteRoleByIds(roleIds)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('应该拒绝删除已分配的角色', async () => {
      const roleIds = [2];
      const role = { roleId: 2, roleName: '普通角色' } as SysRole;

      roleRepository.selectRoleById.mockResolvedValue(role);
      userRoleRepository.countUserRoleByRoleId.mockResolvedValue(5); // 已分配给5个用户

      await expect(service.deleteRoleByIds(roleIds)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteRoleByIds(roleIds)).rejects.toThrow(
        '普通角色已分配,不能删除',
      );
    });
  });

  describe('authDataScope', () => {
    it('应该成功修改数据权限', async () => {
      const role = {
        roleId: 2,
        dataScope: '2',
        deptIds: [100, 101],
      } as Partial<SysRole>;

      roleRepository.updateRole.mockResolvedValue(1);
      roleDeptRepository.deleteRoleDeptByRoleId.mockResolvedValue(1);
      roleDeptRepository.batchRoleDept.mockResolvedValue(2);

      const result = await service.authDataScope(role);

      expect(result).toBe(1);
      expect(roleRepository.updateRole).toHaveBeenCalledWith(role);
      expect(roleDeptRepository.deleteRoleDeptByRoleId).toHaveBeenCalledWith(2);
      expect(roleDeptRepository.batchRoleDept).toHaveBeenCalled();
    });
  });

  describe('insertAuthUsers', () => {
    it('应该成功批量授权用户', async () => {
      const roleId = 2;
      const userIds = [3, 4, 5];

      userRoleRepository.batchInsertUserRole.mockResolvedValue(true);

      const result = await service.insertAuthUsers(roleId, userIds);

      expect(result).toBe(true);
      expect(userRoleRepository.batchInsertUserRole).toHaveBeenCalledWith(
        roleId,
        userIds,
      );
    });
  });

  describe('deleteAuthUsers', () => {
    it('应该成功批量取消授权用户', async () => {
      const roleId = 2;
      const userIds = [3, 4, 5];

      userRoleRepository.deleteUserRoleInfos.mockResolvedValue(true);

      const result = await service.deleteAuthUsers(roleId, userIds);

      expect(result).toBe(true);
      expect(userRoleRepository.deleteUserRoleInfos).toHaveBeenCalledWith(
        roleId,
        userIds,
      );
    });
  });
});

