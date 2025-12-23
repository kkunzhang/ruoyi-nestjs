/**
 * 验证码工具类
 * 使用内存存储验证码（生产环境建议使用Redis）
 */

interface CaptchaData {
  code: string;
  expireTime: number;
}

// 使用 Map 存储验证码（生产环境应使用 Redis）
const captchaStore = new Map<string, CaptchaData>();

export class CaptchaUtil {
  /**
   * 验证码有效期（毫秒）
   */
  private static readonly EXPIRE_TIME = 2 * 60 * 1000; // 2分钟

  /**
   * 生成验证码
   * @param length 验证码长度
   * @returns 验证码文本
   */
  static generateCode(length: number = 4): string {
    const chars = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  /**
   * 生成UUID
   * @returns UUID字符串
   */
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * 保存验证码
   * @param uuid 唯一标识
   * @param code 验证码
   */
  static saveCaptcha(uuid: string, code: string): void {
    const expireTime = Date.now() + this.EXPIRE_TIME;
    captchaStore.set(uuid, { code: code.toLowerCase(), expireTime });
    
    // 定时清理过期验证码
    setTimeout(() => {
      captchaStore.delete(uuid);
    }, this.EXPIRE_TIME);
  }

  /**
   * 验证验证码
   * @param uuid 唯一标识
   * @param code 验证码
   * @returns 是否验证成功
   */
  static verifyCaptcha(uuid: string, code: string): boolean {
    const data = captchaStore.get(uuid);
    
    if (!data) {
      return false; // 验证码不存在
    }

    if (Date.now() > data.expireTime) {
      captchaStore.delete(uuid);
      return false; // 验证码已过期
    }

    // 验证成功后删除验证码（一次性使用）
    captchaStore.delete(uuid);
    
    return data.code === code.toLowerCase();
  }

  /**
   * 删除验证码
   * @param uuid 唯一标识
   */
  static deleteCaptcha(uuid: string): void {
    captchaStore.delete(uuid);
  }

  /**
   * 清理所有过期验证码
   */
  static cleanExpiredCaptcha(): void {
    const now = Date.now();
    for (const [uuid, data] of captchaStore.entries()) {
      if (now > data.expireTime) {
        captchaStore.delete(uuid);
      }
    }
  }

  /**
   * 生成SVG验证码图片
   * @param code 验证码文本
   * @returns SVG字符串
   */
  static generateSvg(code: string): string {
    const width = 100;
    const height = 40;
    const fontSize = 24;
    
    // 生成随机颜色
    const randomColor = () => {
      const r = Math.floor(Math.random() * 200);
      const g = Math.floor(Math.random() * 200);
      const b = Math.floor(Math.random() * 200);
      return `rgb(${r},${g},${b})`;
    };

    // 生成干扰线
    let lines = '';
    for (let i = 0; i < 3; i++) {
      lines += `<line x1="${Math.random() * width}" y1="${Math.random() * height}" 
                     x2="${Math.random() * width}" y2="${Math.random() * height}" 
                     stroke="${randomColor()}" stroke-width="1"/>`;
    }

    // 生成字符
    let chars = '';
    const charWidth = width / code.length;
    for (let i = 0; i < code.length; i++) {
      const x = charWidth * i + charWidth / 2;
      const y = height / 2 + fontSize / 3;
      const rotate = (Math.random() - 0.5) * 30; // -15度到15度
      chars += `<text x="${x}" y="${y}" 
                     font-size="${fontSize}" 
                     fill="${randomColor()}"
                     transform="rotate(${rotate} ${x} ${y})"
                     text-anchor="middle">${code[i]}</text>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      ${lines}
      ${chars}
    </svg>`;
  }
}

// 定期清理过期验证码（每5分钟）
setInterval(() => {
  CaptchaUtil.cleanExpiredCaptcha();
}, 5 * 60 * 1000);

