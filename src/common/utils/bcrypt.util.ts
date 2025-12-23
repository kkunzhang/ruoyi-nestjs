import * as bcrypt from 'bcrypt';

/**
 * 密码加密工具
 */
export class BcryptUtil {
  /**
   * 加密密码
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * 验证密码
   */
  static async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}



