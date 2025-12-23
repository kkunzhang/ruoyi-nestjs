/**
 * 认证相关常量
 */

// JWT 密钥（从环境变量获取）
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Token 过期时间（7天）
export const JWT_EXPIRES_IN = '7d';

// 刷新 Token 过期时间（30天）
export const REFRESH_TOKEN_EXPIRES_IN = '30d';

// Token 请求头名称
export const TOKEN_HEADER = 'Authorization';

// Token 前缀
export const TOKEN_PREFIX = 'Bearer ';

// 超级管理员用户ID
export const ADMIN_USER_ID = 1;

// 超级管理员角色ID
export const ADMIN_ROLE_ID = 1;

