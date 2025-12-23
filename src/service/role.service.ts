import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SysRole } from '../domain/entities/sys-role.entity';
import { SysRoleMenu } from '../domain/entities/sys-role-menu.entity';
import { SysRoleDept } from '../domain/entities/sys-role-dept.entity';
import { RoleRepository } from '../mapper/role.repository';
import { RoleMenuRepository } from '../mapper/role-menu.repository';
import { RoleDeptRepository } from '../mapper/role-dept.repository';
import { UserRoleRepository } from '../mapper/user-role.repository';

/**
 * 角色业务层
 * 对应 Java 的 ISysRoleService / SysRoleServiceImpl
 */
@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly roleMenuRepository: RoleMenuRepository,
    private readonly roleDeptRepository: RoleDeptRepository,
    private readonly userRoleRepository: UserRoleRepository,
  ) {}

  /**
   * 根据条件分页查询角色数据
   * @param role 角色信息
   * @returns 角色数据集合信息
   */
  async selectRoleList(role: Partial<SysRole>): Promise<[SysRole[], number]> {
    return this.roleRepository.selectRoleList(role);
  }

  /**
   * 根据用户ID查询角色列表
   * @param userId 用户ID
   * @returns 角色列表（标记用户已分配的角色）
   */
  async selectRolesByUserId(userId: number): Promise<SysRole[]> {
    const userRoles = await this.roleRepository.selectRolePermissionByUserId(userId);
    const allRoles = await this.selectRoleAll();

    // 标记用户已分配的角色
    for (const role of allRoles) {
      for (const userRole of userRoles) {
        if (role.roleId === userRole.roleId) {
          (role as any).flag = true;
          break;
        }
      }
    }

    return allRoles;
  }

  /**
   * 根据用户ID查询角色权限
   * @param userId 用户ID
   * @returns 权限列表（角色权限字符集合）
   */
  async selectRolePermissionByUserId(userId: number): Promise<Set<string>> {
    const perms = await this.roleRepository.selectRolePermissionByUserId(userId);
    const permsSet = new Set<string>();

    for (const perm of perms) {
      if (perm && perm.roleKey) {
        const keys = perm.roleKey.trim().split(',');
        keys.forEach((key) => permsSet.add(key));
      }
    }

    return permsSet;
  }

  /**
   * 查询所有角色
   * @returns 角色列表
   */
  async selectRoleAll(): Promise<SysRole[]> {
    const [roles] = await this.selectRoleList({});
    return roles;
  }

  /**
   * 根据用户ID获取角色选择框列表
   * @param userId 用户ID
   * @returns 选中角色ID列表
   */
  async selectRoleListByUserId(userId: number): Promise<number[]> {
    return this.roleRepository.selectRoleListByUserId(userId);
  }

  /**
   * 通过角色ID查询角色
   * @param roleId 角色ID
   * @returns 角色对象信息
   */
  async selectRoleById(roleId: number): Promise<SysRole | null> {
    return this.roleRepository.selectRoleById(roleId);
  }

  /**
   * 校验角色名称是否唯一
   * @param role 角色信息
   * @returns 结果 true-唯一 false-不唯一
   */
  async checkRoleNameUnique(role: Partial<SysRole>): Promise<boolean> {
    const roleId = role.roleId || -1;
    const info = await this.roleRepository.checkRoleNameUnique(role.roleName!);

    if (info && info.roleId !== roleId) {
      return false; // 不唯一
    }
    return true; // 唯一
  }

  /**
   * 校验角色权限是否唯一
   * @param role 角色信息
   * @returns 结果 true-唯一 false-不唯一
   */
  async checkRoleKeyUnique(role: Partial<SysRole>): Promise<boolean> {
    const roleId = role.roleId || -1;
    const info = await this.roleRepository.checkRoleKeyUnique(role.roleKey!);

    if (info && info.roleId !== roleId) {
      return false; // 不唯一
    }
    return true; // 唯一
  }

  /**
   * 校验角色是否允许操作
   * @param role 角色信息
   */
  checkRoleAllowed(role: Partial<SysRole>): void {
    if (role.roleId && this.isAdmin(role.roleId)) {
      throw new ForbiddenException('不允许操作超级管理员角色');
    }
  }

  /**
   * 校验角色是否有数据权限
   * @param roleIds 角色ID
   * @param currentUserId 当前用户ID（可选，用于权限校验）
   */
  async checkRoleDataScope(roleIds: number[], currentUserId?: number): Promise<void> {
    // 超级管理员不需要校验
    if (currentUserId === 1) {
      return;
    }

    // TODO: 实现数据权限校验逻辑
    // 检查当前用户是否有权限访问这些角色
    // 如果使用了数据权限，需要验证角色是否在当前用户的数据权限范围内
    for (const roleId of roleIds) {
      const role = await this.selectRoleById(roleId);
      if (!role) {
        throw new ForbiddenException('没有权限访问角色数据！');
      }
    }
  }

  /**
   * 通过角色ID查询角色使用数量
   * @param roleId 角色ID
   * @returns 结果
   */
  async countUserRoleByRoleId(roleId: number): Promise<number> {
    return this.userRoleRepository.countUserRoleByRoleId(roleId);
  }

  /**
   * 新增保存角色信息
   * @param role 角色信息
   * @returns 结果
   */
  async insertRole(role: SysRole): Promise<number> {
    // 新增角色信息
    const savedRole = await this.roleRepository.insertRole(role);
    
    // 新增角色菜单关联
    if (role.menuIds && role.menuIds.length > 0) {
      await this.insertRoleMenu(savedRole.roleId, role.menuIds);
    }

    return 1;
  }

  /**
   * 修改保存角色信息
   * @param role 角色信息
   * @returns 结果
   */
  async updateRole(role: Partial<SysRole>): Promise<number> {
    // 修改角色信息
    await this.roleRepository.updateRole(role);

    // 删除角色与菜单关联
    await this.roleMenuRepository.deleteRoleMenuByRoleId(role.roleId!);

    // 新增角色菜单关联
    if (role.menuIds && role.menuIds.length > 0) {
      await this.insertRoleMenu(role.roleId!, role.menuIds);
    }

    return 1;
  }

  /**
   * 修改角色状态
   * @param role 角色信息
   * @returns 结果
   */
  async updateRoleStatus(role: Partial<SysRole>): Promise<number> {
    return this.roleRepository.updateRole(role);
  }

  /**
   * 修改数据权限信息
   * @param role 角色信息
   * @returns 结果
   */
  async authDataScope(role: Partial<SysRole>): Promise<number> {
    // 修改角色信息
    await this.roleRepository.updateRole(role);

    // 删除角色与部门关联
    await this.roleDeptRepository.deleteRoleDeptByRoleId(role.roleId!);

    // 新增角色和部门信息（数据权限）
    if (role.deptIds && role.deptIds.length > 0) {
      await this.insertRoleDept(role.roleId!, role.deptIds);
    }

    return 1;
  }

  /**
   * 通过角色ID删除角色
   * @param roleId 角色ID
   * @returns 结果
   */
  async deleteRoleById(roleId: number): Promise<number> {
    // 删除角色与菜单关联
    await this.roleMenuRepository.deleteRoleMenuByRoleId(roleId);

    // 删除角色与部门关联
    await this.roleDeptRepository.deleteRoleDeptByRoleId(roleId);

    // 删除角色
    return this.roleRepository.deleteRoleById(roleId);
  }

  /**
   * 批量删除角色信息
   * @param roleIds 需要删除的角色ID
   * @returns 结果
   */
  async deleteRoleByIds(roleIds: number[]): Promise<number> {
    // 校验角色
    for (const roleId of roleIds) {
      // 检查是否超级管理员
      this.checkRoleAllowed({ roleId });

      // 检查数据权限
      await this.checkRoleDataScope([roleId]);

      // 检查角色是否已分配给用户
      const role = await this.selectRoleById(roleId);
      const count = await this.countUserRoleByRoleId(roleId);
      if (count > 0) {
        throw new BadRequestException(`${role?.roleName}已分配,不能删除`);
      }
    }

    // 删除角色与菜单关联
    await this.roleMenuRepository.deleteRoleMenu(roleIds);

    // 删除角色与部门关联
    await this.roleDeptRepository.deleteRoleDept(roleIds);

    // 删除角色
    return this.roleRepository.deleteRoleByIds(roleIds);
  }

  /**
   * 取消授权用户角色
   * @param userId 用户ID
   * @param roleId 角色ID
   * @returns 结果
   */
  async deleteAuthUser(userId: number, roleId: number): Promise<boolean> {
    return this.userRoleRepository.deleteUserRoleInfo(userId, roleId);
  }

  /**
   * 批量取消授权用户角色
   * @param roleId 角色ID
   * @param userIds 需要取消授权的用户数据ID
   * @returns 结果
   */
  async deleteAuthUsers(roleId: number, userIds: number[]): Promise<boolean> {
    return this.userRoleRepository.deleteUserRoleInfos(roleId, userIds);
  }

  /**
   * 批量选择授权用户角色
   * @param roleId 角色ID
   * @param userIds 需要授权的用户数据ID
   * @returns 结果
   */
  async insertAuthUsers(roleId: number, userIds: number[]): Promise<boolean> {
    return this.userRoleRepository.batchInsertUserRole(roleId, userIds);
  }

  /**
   * 新增角色菜单信息
   * @param roleId 角色ID
   * @param menuIds 菜单ID列表
   * @returns 结果
   */
  private async insertRoleMenu(roleId: number, menuIds: number[]): Promise<number> {
    if (!menuIds || menuIds.length === 0) {
      return 1;
    }

    const roleMenuList: Partial<SysRoleMenu>[] = menuIds.map((menuId) => ({
      roleId,
      menuId,
    }));

    return this.roleMenuRepository.batchRoleMenu(roleMenuList);
  }

  /**
   * 新增角色部门信息(数据权限)
   * @param roleId 角色ID
   * @param deptIds 部门ID列表
   * @returns 结果
   */
  private async insertRoleDept(roleId: number, deptIds: number[]): Promise<number> {
    if (!deptIds || deptIds.length === 0) {
      return 1;
    }

    const roleDeptList: Partial<SysRoleDept>[] = deptIds.map((deptId) => ({
      roleId,
      deptId,
    }));

    return this.roleDeptRepository.batchRoleDept(roleDeptList);
  }

  /**
   * 判断是否超级管理员
   * @param roleId 角色ID
   * @returns 结果
   */
  private isAdmin(roleId: number): boolean {
    return roleId === 1;
  }
}

