/**
 * 字符串工具类
 */
export class StringUtil {
  /**
   * 判断字符串是否为空
   */
  static isEmpty(str: string | null | undefined): boolean {
    return !str || str.trim().length === 0;
  }

  /**
   * 判断字符串是否不为空
   */
  static isNotEmpty(str: string | null | undefined): boolean {
    return !this.isEmpty(str);
  }

  /**
   * 驼峰转下划线
   */
  static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  /**
   * 下划线转驼峰
   */
  static snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * 生成随机字符串
   */
  static random(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}


