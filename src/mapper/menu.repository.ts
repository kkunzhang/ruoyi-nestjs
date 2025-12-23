import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysMenu } from '../domain/entities/sys-menu.entity';

/**
 * 菜单权限 Repository
 */
@Injectable()
export class MenuRepository {
  constructor(
    @InjectRepository(SysMenu)
    private readonly menuRepository: Repository<SysMenu>,
  ) {}

  /**
   * 根据用户ID查询权限
   * @param userId 用户ID
   * @returns 权限列表
   */
  async selectMenuPermsByUserId(userId: number): Promise<string[]> {
    const query = `
      SELECT DISTINCT m.perms
      FROM sys_menu m
      LEFT JOIN sys_role_menu rm ON m.menu_id = rm.menu_id
      LEFT JOIN sys_user_role ur ON ur.role_id = rm.role_id
      WHERE ur.user_id = ?
        AND m.status = '0'
        AND m.perms IS NOT NULL
        AND m.perms != ''
    `;

    const results = await this.menuRepository.query(query, [userId]);
    
    // 提取所有权限字符串
    const permissions: string[] = [];
    for (const row of results) {
      if (row.perms) {
        // 可能一个菜单有多个权限，用逗号分隔
        const perms = row.perms.split(',').map((p: string) => p.trim()).filter((p: string) => p);
        permissions.push(...perms);
      }
    }

    return [...new Set(permissions)]; // 去重
  }

  /**
   * 根据角色ID查询权限
   * @param roleId 角色ID
   * @returns 权限列表
   */
  async selectMenuPermsByRoleId(roleId: number): Promise<string[]> {
    const query = `
      SELECT DISTINCT m.perms
      FROM sys_menu m
      LEFT JOIN sys_role_menu rm ON m.menu_id = rm.menu_id
      WHERE rm.role_id = ?
        AND m.status = '0'
        AND m.perms IS NOT NULL
        AND m.perms != ''
    `;

    const results = await this.menuRepository.query(query, [roleId]);
    
    const permissions: string[] = [];
    for (const row of results) {
      if (row.perms) {
        const perms = row.perms.split(',').map((p: string) => p.trim()).filter((p: string) => p);
        permissions.push(...perms);
      }
    }

    return [...new Set(permissions)];
  }

  /**
   * 查询所有权限
   * @returns 权限列表
   */
  async selectMenuPerms(): Promise<string[]> {
    const menus = await this.menuRepository.find({
      where: { status: '0' },
      select: ['perms'],
    });

    const permissions: string[] = [];
    for (const menu of menus) {
      if (menu.perms) {
        const perms = menu.perms.split(',').map(p => p.trim()).filter(p => p);
        permissions.push(...perms);
      }
    }

    return [...new Set(permissions)];
  }
}

