import { Controller, Post, Get, Body, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from '../service/auth.service';
import { ResponseDto } from '../common/dto/response.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Log, BusinessType } from '../common/decorators/log.decorator';
import { CaptchaService } from '../common/services/captcha.service';
import { LoginUser } from '../common/interfaces/login-user.interface';

/**
 * 认证 Controller
 */
@ApiTags('认证管理')
@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly captchaService: CaptchaService,
  ) {}

  /**
   * 获取验证码
   */
  @Public()
  @Get('captchaImage')
  @ApiOperation({ summary: '获取验证码' })
  @ApiResponse({ status: 200, description: '操作成功', type: ResponseDto })
  async captchaImage(): Promise<ResponseDto> {
    // 生成验证码
    const code = this.captchaService.generateCode(4);
    const uuid = this.captchaService.generateUUID();
    
    // 保存验证码到 Redis
    await this.captchaService.saveCaptcha(uuid, code);
    
    // 生成SVG图片
    const img = this.captchaService.generateSvg(code);
    
    return ResponseDto.success({
      uuid,
      img,
    });
  }

  /**
   * 用户登录
   */
  @Public()
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功', type: ResponseDto })
  @Log({ title: '用户登录', businessType: BusinessType.OTHER })
  async login(@Body() loginDto: LoginDto, @Req() request: Request): Promise<ResponseDto> {
    // 验证验证码（从 Redis 中验证）
    if (loginDto.code && loginDto.uuid) {
      const isValid = await this.captchaService.verifyCaptcha(loginDto.uuid, loginDto.code);
      if (!isValid) {
        throw new BadRequestException('验证码错误或已过期');
      }
    }

    // 传入 request 用于获取 IP 和 User-Agent
    const result = await this.authService.login(
      loginDto.userName,
      loginDto.password,
      request,
    );
    return ResponseDto.success(result, '登录成功');
  }

  /**
   * 获取用户信息（从 Redis 中的 LoginUser）
   */
  @Get('getInfo')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户信息' })
  @ApiResponse({ status: 200, description: '查询成功', type: ResponseDto })
  async getInfo(@CurrentUser() loginUser: LoginUser): Promise<ResponseDto> {
    const result = await this.authService.getUserInfo(loginUser);
    return ResponseDto.success(result);
  }

  /**
   * 退出登录（删除 Redis 中的用户信息）
   */
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: '退出登录' })
  @ApiResponse({ status: 200, description: '退出成功', type: ResponseDto })
  @Log({ title: '退出登录', businessType: BusinessType.OTHER })
  async logout(@CurrentUser() loginUser: LoginUser): Promise<ResponseDto> {
    // 删除 Redis 中的用户信息
    await this.authService.logout(loginUser.token);
    return ResponseDto.success(null, '退出成功');
  }
}

