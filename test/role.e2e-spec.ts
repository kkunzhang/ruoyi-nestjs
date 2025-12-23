import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

/**
 * 角色管理 E2E 测试（最小集合）
 * 
 * 目的：验证核心功能能跑通，不需要覆盖所有接口
 */
describe('RoleController (e2e) - 最小测试集合', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // 配置全局管道、过滤器、拦截器
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * 1️⃣ 健康检查 - 验证应用能跑、路由正常、拦截器生效
   */
  describe('1️⃣ 健康检查', () => {
    it('GET / - 应该返回健康状态', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .expect(200);

      // 验证全局拦截器生效（TransformInterceptor）
      expect(response.text).toContain('RuoYi NestJS API is running');
    });
  });

  /**
   * 2️⃣ 登录接口 - 验证认证流程、JWT生成
   */
  describe('2️⃣ 登录接口', () => {
    it('POST /login - 应该成功登录并获取 token', async () => {
      const response = await request(app.getHttpServer())
        .post('/login')
        .send({
          userName: 'admin',
          password: 'admin123',
        })
        .expect(200);

      // 验证响应格式（ResponseDto）
      expect(response.body.code).toBe(200);
      expect(response.body.msg).toContain('成功');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('user');
      
      // 保存 token 供后续测试使用
      authToken = response.body.data.accessToken;
    });

    it('POST /login - 应该拒绝错误的密码', async () => {
      const response = await request(app.getHttpServer())
        .post('/login')
        .send({
          userName: 'admin',
          password: 'wrong_password',
        })
        .expect(401);

      expect(response.body.msg).toContain('用户名或密码错误');
    });
  });

  /**
   * 3️⃣ 受保护的接口 - 验证JWT认证、权限控制、业务逻辑
   */
  describe('3️⃣ 受保护的接口（角色列表）', () => {
    it('GET /system/role/list - 应该拒绝无 token 的请求', async () => {
      await request(app.getHttpServer())
        .get('/system/role/list')
        .expect(401);
    });

    it('GET /system/role/list - 应该返回角色列表（有 token）', async () => {
      const response = await request(app.getHttpServer())
        .get('/system/role/list')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ pageNum: 1, pageSize: 10 })
        .expect(200);

      // 验证响应格式
      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.rows)).toBe(true);
      
      // 验证返回了数据（至少有超级管理员和普通角色）
      expect(response.body.data.total).toBeGreaterThan(0);
    });

    it('POST /system/role - 应该验证必填字段（DTO验证）', async () => {
      const response = await request(app.getHttpServer())
        .post('/system/role')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleName: '', // 空值
          roleKey: 'test',
        })
        .expect(400);

      // 验证全局异常过滤器生效（HttpExceptionFilter）
      expect(response.body.code).toBe(400);
    });

    it('POST /system/role - 应该拒绝重复的角色名称（业务校验）', async () => {
      const response = await request(app.getHttpServer())
        .post('/system/role')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleName: '超级管理员', // 已存在
          roleKey: 'test_unique',
          roleSort: 1,
          status: '0',
        })
        .expect(400);

      expect(response.body.msg).toContain('角色名称已存在');
    });

    it('PUT /system/role - 应该拒绝修改超级管理员角色（业务保护）', async () => {
      const response = await request(app.getHttpServer())
        .put('/system/role')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleId: 1,
          roleName: '超级管理员（修改）',
          roleKey: 'admin',
          roleSort: 1,
          status: '0',
        })
        .expect(403);

      expect(response.body.msg).toContain('不允许操作超级管理员角色');
    });
  });
});

