import * as bcrypt from 'bcrypt';

/**
 * BCrypt 密码加密工具类
 * 对应 Java 的 SecurityUtils.encryptPassword
 */
export class BcryptUtil {
  /**
   * 加密密码
   * @param password 明文密码
   * @returns 加密后的密码
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * 验证密码
   * @param password 明文密码
   * @param hashedPassword 加密后的密码
   * @returns 是否匹配
   */
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
