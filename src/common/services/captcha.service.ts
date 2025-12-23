import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

/**
 * 验证码服务
 * 使用 Redis 存储验证码（对应若依的 CaptchaController）
 */
@Injectable()
export class CaptchaService implements OnModuleInit {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /**
   * 验证码 Redis Key 前缀（与若依保持一致）
   */
  private readonly CAPTCHA_CODE_KEY = 'captcha_codes:';

  /**
   * 验证码过期时间（秒）
   */
  private readonly EXPIRE_TIME = 120; // 2分钟

  /**
   * 模块初始化时测试 Redis 连接
   */
  async onModuleInit() {
    try {
      await this.redis.ping();
      console.log('✅ Redis 连接成功');
    } catch (error) {
      console.error('❌ Redis 连接失败:', error.message);
    }
  }

  /**
   * 生成验证码
   * @param length 验证码长度
   * @returns 验证码文本
   */
  generateCode(length: number = 4): string {
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
  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * 保存验证码到 Redis
   * @param uuid 唯一标识
   * @param code 验证码
   */
  async saveCaptcha(uuid: string, code: string): Promise<void> {
    const key = this.CAPTCHA_CODE_KEY + uuid;
    await this.redis.set(key, code.toLowerCase(), 'EX', this.EXPIRE_TIME);
  }

  /**
   * 验证验证码
   * @param uuid 唯一标识
   * @param code 验证码
   * @returns 是否验证成功
   */
  async verifyCaptcha(uuid: string, code: string): Promise<boolean> {
    const key = this.CAPTCHA_CODE_KEY + uuid;
    const savedCode = await this.redis.get(key);

    if (!savedCode) {
      return false; // 验证码不存在或已过期
    }

    // 验证成功后删除验证码（一次性使用）
    await this.redis.del(key);

    return savedCode === code.toLowerCase();
  }

  /**
   * 删除验证码
   * @param uuid 唯一标识
   */
  async deleteCaptcha(uuid: string): Promise<void> {
    const key = this.CAPTCHA_CODE_KEY + uuid;
    await this.redis.del(key);
  }

  /**
   * 生成SVG验证码图片
   * @param code 验证码文本
   * @returns SVG字符串
   */
  generateSvg(code: string): string {
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

  /**
   * 获取 Redis 连接状态
   */
  async getStatus(): Promise<string> {
    return this.redis.status;
  }

  /**
   * 测试 Redis 连接
   */
  async ping(): Promise<string> {
    return await this.redis.ping();
  }
}

