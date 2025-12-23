import { Controller, Post, Get, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../service/auth.service';
import { ResponseDto } from '../common/dto/response.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Log, BusinessType } from '../common/decorators/log.decorator';
import { CaptchaUtil } from '../common/utils/captcha.util';

/**
 * 认证 Controller
 */
@ApiTags('认证管理')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 获取验证码
   */
  @Public()
  @Get('captchaImage')
  @ApiOperation({ summary: '获取验证码' })
  @ApiResponse({ status: 200, description: '操作成功', type: ResponseDto })
  async captchaImage(): Promise<ResponseDto> {
    // 生成验证码
    const code = CaptchaUtil.generateCode(4);
    const uuid = CaptchaUtil.generateUUID();
    
    // 保存验证码
    CaptchaUtil.saveCaptcha(uuid, code);
    
    // 生成SVG图片
    const img = CaptchaUtil.generateSvg(code);
    
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
  async login(@Body() loginDto: LoginDto): Promise<ResponseDto> {
    // 验证验证码（可选，生产环境建议启用）
    if (loginDto.code && loginDto.uuid) {
      const isValid = CaptchaUtil.verifyCaptcha(loginDto.uuid, loginDto.code);
      if (!isValid) {
        throw new BadRequestException('验证码错误或已过期');
      }
    }

    const result = await this.authService.login(
      loginDto.userName,
      loginDto.password,
    );
    return ResponseDto.success(result, '登录成功');
  }

  /**
   * 获取用户信息
   */
  @Get('getInfo')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户信息' })
  @ApiResponse({ status: 200, description: '查询成功', type: ResponseDto })
  async getInfo(@CurrentUser('userId') userId: number): Promise<ResponseDto> {
    const result = await this.authService.getUserInfo(userId);
    return ResponseDto.success(result);
  }

  /**
   * 退出登录
   */
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: '退出登录' })
  @ApiResponse({ status: 200, description: '退出成功', type: ResponseDto })
  @Log({ title: '退出登录', businessType: BusinessType.OTHER })
  async logout(@CurrentUser('userId') userId: number): Promise<ResponseDto> {
    await this.authService.logout(userId);
    return ResponseDto.success(null, '退出成功');
  }
}

