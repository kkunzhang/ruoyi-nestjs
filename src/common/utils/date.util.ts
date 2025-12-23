/**
 * 日期工具类
 */
export class DateUtil {
  /**
   * 格式化日期
   */
  static format(date: Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 获取当前时间戳
   */
  static now(): Date {
    return new Date();
  }

  /**
   * 日期相加
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * 日期相减
   */
  static subtractDays(date: Date, days: number): Date {
    return this.addDays(date, -days);
  }
}



