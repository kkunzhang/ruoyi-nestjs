import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SysRole } from '../domain/entities/sys-role.entity';
import { SysRoleMenu } from '../domain/entities/sys-role-menu.entity';
import { SysRoleDept } from '../domain/entities/sys-role-dept.entity';
import { RoleRepository } from '../mapper/role.repository';
import { RoleMenuRepository } from '../mapper/role-menu.repository';
import { RoleDeptRepository } from '../mapper/role-dept.repository';
import { UserRoleRepository } from '../mapper/user-role.repository';
import { MenuRepository } from '../mapper/menu.repository';
import { TokenService } from '../common/services/token.service';

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
    private readonly menuRepository: MenuRepository,
    private readonly tokenService: TokenService,
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
   * 根据用户ID查询权限
   * @param userId 用户ID
   * @returns 权限列表
   */
  async selectRolePermissionByUserId(userId: number): Promise<SysRole[]> {
    return this.roleRepository.selectRolePermissionByUserId(userId);
  }

  /**
   * 查询所有角色
   * @returns 角色列表
   */
  async selectRoleAll(): Promise<SysRole[]> {
    return this.roleRepository.selectRoleAll();
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
   * @returns true: 唯一, false: 不唯一
   */
  async checkRoleNameUnique(role: Partial<SysRole>): Promise<boolean> {
    const roleId = role.roleId || -1;
    const info = await this.roleRepository.checkRoleNameUnique(role.roleName!);
    return !info || info.roleId === roleId;
  }

  /**
   * 校验角色权限是否唯一
   * @param role 角色信息
   * @returns true: 唯一, false: 不唯一
   */
  async checkRoleKeyUnique(role: Partial<SysRole>): Promise<boolean> {
    const roleId = role.roleId || -1;
    const info = await this.roleRepository.checkRoleKeyUnique(role.roleKey!);
    return !info || info.roleId === roleId;
  }

  /**
   * 校验角色是否允许操作
   * @param role 角色信息
   */
  checkRoleAllowed(role: Partial<SysRole>): void {
    if (role.roleId && role.roleId === 1) {
      throw new ForbiddenException('不允许操作超级管理员角色');
    }
  }

  /**
   * 校验角色是否有数据权限
   * @param roleId 角色ID
   */
  checkRoleDataScope(roleId: number): void {
    if (roleId === 1) {
      return; // 超级管理员，跳过校验
    }
    // TODO: 实现数据权限校验
    // 根据当前用户的数据权限，判断是否有权限操作该角色
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
  async insertRole(role: Partial<SysRole>): Promise<number> {
    // 新增角色信息
    const result = await this.roleRepository.insertRole(role as SysRole);

    // 新增角色菜单关联
    if (role.menuIds && role.menuIds.length > 0 && result) {
      await this.insertRoleMenu(result.roleId, role.menuIds);
    }

    return result ? result.roleId : 0;
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

    // 刷新该角色下所有在线用户的权限（若依机制）
    await this.refreshRoleUsersPermissions(role.roleId!);

    return 1;
  }

  /**
   * 修改角色状态
   * @param role 角色信息
   * @returns 结果
   */
  async updateRoleStatus(role: Partial<SysRole>): Promise<number> {
    const result = await this.roleRepository.updateRole(role);

    // 刷新该角色下所有在线用户的权限
    if (result > 0) {
      await this.refreshRoleUsersPermissions(role.roleId!);
    }

    return result;
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

    // 数据权限修改不影响功能权限，但为了保险起见也刷新一下
    await this.refreshRoleUsersPermissions(role.roleId!);

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
    for (const roleId of roleIds) {
      // 检查角色是否被分配给用户
      const count = await this.countUserRoleByRoleId(roleId);
      if (count > 0) {
        const role = await this.selectRoleById(roleId);
        throw new BadRequestException(`角色【${role?.roleName}】已分配，不能删除`);
      }
    }

    // 批量删除角色
    for (const roleId of roleIds) {
      await this.deleteRoleById(roleId);
    }

    return roleIds.length;
  }

  /**
   * 取消授权用户角色
   * @param roleId 角色ID
   * @param userId 用户ID
   * @returns 结果
   */
  async deleteAuthUser(roleId: number, userId: number): Promise<number> {
    const result = await this.userRoleRepository.deleteUserRoleInfo(userId, roleId);
    return result ? 1 : 0;
  }

  /**
   * 批量取消授权用户角色
   * @param roleId 角色ID
   * @param userIds 需要删除的用户数据ID
   * @returns 结果
   */
  async deleteAuthUsers(roleId: number, userIds: number[]): Promise<number> {
    const result = await this.userRoleRepository.deleteUserRoleInfos(roleId, userIds);
    return result ? userIds.length : 0;
  }

  /**
   * 批量选择授权用户角色
   * @param roleId 角色ID
   * @param userIds 需要授权的用户数据ID
   * @returns 结果
   */
  async insertAuthUsers(roleId: number, userIds: number[]): Promise<number> {
    const result = await this.userRoleRepository.batchInsertUserRole(roleId, userIds);
    return result ? userIds.length : 0;
  }

  /**
   * 新增角色菜单信息
   * @param roleId 角色ID
   * @param menuIds 菜单ID列表
   */
  private async insertRoleMenu(roleId: number, menuIds: number[]): Promise<void> {
    const roleMenus: Partial<SysRoleMenu>[] = menuIds.map((menuId) => ({
      roleId,
      menuId,
    }));

    await this.roleMenuRepository.batchRoleMenu(roleMenus);
  }

  /**
   * 新增角色部门信息（数据权限）
   * @param roleId 角色ID
   * @param deptIds 部门ID列表
   */
  private async insertRoleDept(roleId: number, deptIds: number[]): Promise<void> {
    const roleDepts: Partial<SysRoleDept>[] = deptIds.map((deptId) => ({
      roleId,
      deptId,
    }));

    await this.roleDeptRepository.batchRoleDept(roleDepts);
  }

  /**
   * 刷新指定角色下所有在线用户的权限（若依机制）
   * @param roleId 角色ID
   */
  private async refreshRoleUsersPermissions(roleId: number): Promise<void> {
    try {
      await this.tokenService.refreshRoleUsersPermissions(
        roleId,
        // 获取角色下的用户ID列表
        async (roleId: number) => {
          return await this.userRoleRepository.selectUserIdsByRoleId(roleId);
        },
        // 获取用户的权限列表
        async (userId: number) => {
          if (userId === 1) {
            // 超级管理员
            return ['*:*:*'];
          }
          return await this.menuRepository.selectMenuPermsByUserId(userId);
        },
      );
    } catch (error) {
      console.error('刷新用户权限失败:', error);
      // 不影响主流程，只记录错误
    }
  }
}
