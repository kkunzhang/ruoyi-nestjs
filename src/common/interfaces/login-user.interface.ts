import { SysUser } from '../../domain/entities/sys-user.entity';

/**
 * 登录用户信息
 * 对应若依的 LoginUser
 */
export interface LoginUser {
  /**
   * 用户ID
   */
  userId: number;

  /**
   * 部门ID（可选）
   */
  deptId?: number;

  /**
   * 用户唯一标识（UUID）
   */
  token: string;

  /**
   * 登录时间（毫秒时间戳）
   */
  loginTime: number;

  /**
   * 过期时间（毫秒时间戳）
   */
  expireTime: number;

  /**
   * 登录IP地址
   */
  ipaddr: string;

  /**
   * 登录地点
   */
  loginLocation?: string;

  /**
   * 浏览器类型
   */
  browser?: string;

  /**
   * 操作系统
   */
  os?: string;

  /**
   * 权限列表
   */
  permissions: string[];

  /**
   * 用户信息
   */
  user: SysUser;
}

