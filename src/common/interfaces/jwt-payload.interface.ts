/**
 * JWT Payload 接口
 */
export interface JwtPayload {
  userId: number;
  userName: string;
  deptId?: number;
  roleIds?: number[];
  permissions?: string[];
}

/**
 * 请求用户信息接口
 */
export interface RequestUser extends JwtPayload {
  iat?: number; // issued at
  exp?: number; // expiration time
}

