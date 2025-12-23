import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('RoleController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let testRoleId: number;

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

    dataSource = app.get(DataSource);

    // 清理测试数据（删除 roleId > 2 的角色）
    await dataSource.query(
      "DELETE FROM sys_role WHERE role_id > 2 AND role_name LIKE '%E2E%'",
    );
  });

  afterAll(async () => {
    // 清理测试数据
    if (testRoleId) {
      await dataSource.query('DELETE FROM sys_role WHERE role_id = ?', [
        testRoleId,
      ]);
    }
    await dataSource.query(
      "DELETE FROM sys_role WHERE role_name LIKE '%E2E%'",
    );
    
    await app.close();
  });

  describe('身份认证', () => {
    it('应该成功登录并获取 token', async () => {
      const response = await request(app.getHttpServer())
        .post('/login')
        .send({
          userName: 'admin',
          password: 'admin123',
        })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
      authToken = response.body.data.accessToken;
    });

    it('应该拒绝无 token 的请求', async () => {
      await request(app.getHttpServer())
        .get('/system/role/list')
        .expect(401);
    });
  });

  describe('GET /system/role/list - 获取角色列表', () => {
    it('应该返回角色列表（带分页）', async () => {
      const response = await request(app.getHttpServer())
        .get('/system/role/list')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ pageNum: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.rows)).toBe(true);
    });

    it('应该支持筛选条件', async () => {
      const response = await request(app.getHttpServer())
        .get('/system/role/list')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          pageNum: 1, 
          pageSize: 10,
          roleName: '管理员',
          status: '0'
        })
        .expect(200);

      expect(response.body.code).toBe(200);
    });
  });

  describe('POST /system/role - 新增角色', () => {
    it('应该成功新增角色', async () => {
      const newRole = {
        roleName: '测试角色E2E',
        roleKey: 'test_e2e',
        roleSort: 10,
        status: '0',
        dataScope: '1',
        menuCheckStrictly: true,
        deptCheckStrictly: true,
        menuIds: [1, 2, 3],
        remark: '这是一个E2E测试角色',
      };

      const response = await request(app.getHttpServer())
        .post('/system/role')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newRole)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.msg).toContain('成功');

      // 验证数据库中已插入
      const roles = await dataSource.query(
        'SELECT * FROM sys_role WHERE role_key = ?',
        ['test_e2e'],
      );
      expect(roles.length).toBe(1);
      expect(roles[0].role_name).toBe('测试角色E2E');
      testRoleId = roles[0].role_id;

      // 验证菜单关联已插入
      const roleMenus = await dataSource.query(
        'SELECT * FROM sys_role_menu WHERE role_id = ?',
        [testRoleId],
      );
      expect(roleMenus.length).toBe(3);
    });

    it('应该拒绝重复的角色名称', async () => {
      const duplicateRole = {
        roleName: '超级管理员',
        roleKey: 'test_duplicate',
        roleSort: 1,
        status: '0',
      };

      const response = await request(app.getHttpServer())
        .post('/system/role')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateRole)
        .expect(400);

      expect(response.body.msg).toContain('角色名称已存在');
    });

    it('应该验证必填字段', async () => {
      const invalidRole = {
        roleName: '',
        roleKey: 'test',
      };

      await request(app.getHttpServer())
        .post('/system/role')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRole)
        .expect(400);
    });

    it('应该验证字段长度', async () => {
      const invalidRole = {
        roleName: 'a'.repeat(31), // 超过30个字符
        roleKey: 'test_long',
        roleSort: 1,
        status: '0',
      };

      await request(app.getHttpServer())
        .post('/system/role')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRole)
        .expect(400);
    });
  });

  describe('GET /system/role/:roleId - 获取角色详情', () => {
    it('应该返回角色详情', async () => {
      const response = await request(app.getHttpServer())
        .get('/system/role/2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('roleId');
      expect(response.body.data.roleId).toBe(2);
    });

    it('应该返回 null 当角色不存在时', async () => {
      const response = await request(app.getHttpServer())
        .get('/system/role/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeNull();
    });
  });

  describe('PUT /system/role - 修改角色', () => {
    it('应该成功修改角色', async () => {
      if (!testRoleId) return;

      const updateRole = {
        roleId: testRoleId,
        roleName: '测试角色E2E（已修改）',
        roleKey: 'test_e2e',
        roleSort: 11,
        status: '0',
        dataScope: '2',
        menuIds: [1, 2],
        deptIds: [100, 101],
      };

      const response = await request(app.getHttpServer())
        .put('/system/role')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateRole)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.msg).toContain('成功');

      // 验证数据库已更新
      const roles = await dataSource.query(
        'SELECT * FROM sys_role WHERE role_id = ?',
        [testRoleId],
      );
      expect(roles[0].role_name).toContain('已修改');
      expect(roles[0].role_sort).toBe(11);

      // 验证菜单关联已更新（应该是2个）
      const roleMenus = await dataSource.query(
        'SELECT * FROM sys_role_menu WHERE role_id = ?',
        [testRoleId],
      );
      expect(roleMenus.length).toBe(2);

      // 验证部门关联已插入
      const roleDepts = await dataSource.query(
        'SELECT * FROM sys_role_dept WHERE role_id = ?',
        [testRoleId],
      );
      expect(roleDepts.length).toBe(2);
    });

    it('应该拒绝修改超级管理员角色', async () => {
      const updateAdmin = {
        roleId: 1,
        roleName: '超级管理员（修改）',
        roleKey: 'admin',
        roleSort: 1,
        status: '0',
      };

      const response = await request(app.getHttpServer())
        .put('/system/role')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateAdmin)
        .expect(403);

      expect(response.body.msg).toContain('不允许操作超级管理员角色');
    });
  });

  describe('PUT /system/role/changeStatus - 修改角色状态', () => {
    it('应该成功修改角色状态', async () => {
      if (!testRoleId) return;

      // 停用角色
      let response = await request(app.getHttpServer())
        .put('/system/role/changeStatus')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleId: testRoleId,
          status: '1',
        })
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证数据库
      let roles = await dataSource.query(
        'SELECT * FROM sys_role WHERE role_id = ?',
        [testRoleId],
      );
      expect(roles[0].status).toBe('1');

      // 启用角色
      response = await request(app.getHttpServer())
        .put('/system/role/changeStatus')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleId: testRoleId,
          status: '0',
        })
        .expect(200);

      roles = await dataSource.query(
        'SELECT * FROM sys_role WHERE role_id = ?',
        [testRoleId],
      );
      expect(roles[0].status).toBe('0');
    });
  });

  describe('PUT /system/role/dataScope - 修改数据权限', () => {
    it('应该成功修改数据权限', async () => {
      if (!testRoleId) return;

      const response = await request(app.getHttpServer())
        .put('/system/role/dataScope')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleId: testRoleId,
          dataScope: '2',
          deptIds: [100, 101, 102],
        })
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证部门关联已更新
      const roleDepts = await dataSource.query(
        'SELECT * FROM sys_role_dept WHERE role_id = ?',
        [testRoleId],
      );
      expect(roleDepts.length).toBe(3);
    });
  });

  describe('GET /system/role/optionselect - 角色选择框列表', () => {
    it('应该返回所有角色列表', async () => {
      const response = await request(app.getHttpServer())
        .get('/system/role/optionselect')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /system/role/:roleIds - 删除角色', () => {
    it('应该拒绝删除超级管理员角色', async () => {
      const response = await request(app.getHttpServer())
        .delete('/system/role/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.msg).toContain('不允许操作超级管理员角色');
    });

    it('应该拒绝删除已分配的角色', async () => {
      const response = await request(app.getHttpServer())
        .delete('/system/role/2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.msg).toContain('已分配');
    });

    it('应该成功删除角色', async () => {
      if (!testRoleId) return;

      const response = await request(app.getHttpServer())
        .delete(`/system/role/${testRoleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.msg).toContain('成功');

      // 验证角色已软删除
      const roles = await dataSource.query(
        'SELECT * FROM sys_role WHERE role_id = ?',
        [testRoleId],
      );
      expect(roles[0].del_flag).toBe('2');

      // 验证关联关系已删除
      const roleMenus = await dataSource.query(
        'SELECT * FROM sys_role_menu WHERE role_id = ?',
        [testRoleId],
      );
      expect(roleMenus.length).toBe(0);

      const roleDepts = await dataSource.query(
        'SELECT * FROM sys_role_dept WHERE role_id = ?',
        [testRoleId],
      );
      expect(roleDepts.length).toBe(0);
    });

    it('应该支持批量删除', async () => {
      // 创建两个测试角色
      await dataSource.query(
        `INSERT INTO sys_role (role_name, role_key, role_sort, status, del_flag, create_time) 
         VALUES ('批量删除1E2E', 'batch_delete1', 98, '0', '0', NOW()),
                ('批量删除2E2E', 'batch_delete2', 99, '0', '0', NOW())`,
      );

      const roles = await dataSource.query(
        "SELECT role_id FROM sys_role WHERE role_name LIKE '%批量删除%E2E'",
      );
      const roleIds = roles.map((r: any) => r.role_id).join(',');

      const response = await request(app.getHttpServer())
        .delete(`/system/role/${roleIds}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
    });
  });

  describe('用户授权相关接口', () => {
    it('GET /system/role/authUser/allocatedList - 应该返回已分配用户列表', async () => {
      const response = await request(app.getHttpServer())
        .get('/system/role/authUser/allocatedList')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ roleId: 2, pageNum: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
      expect(response.body.data).toHaveProperty('total');
    });

    it('GET /system/role/authUser/unallocatedList - 应该返回未分配用户列表', async () => {
      const response = await request(app.getHttpServer())
        .get('/system/role/authUser/unallocatedList')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ roleId: 2, pageNum: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
    });
  });

  describe('操作日志验证', () => {
    it('应该记录角色新增操作日志', async () => {
      const logsBeforeCount = await dataSource.query(
        "SELECT COUNT(*) as count FROM sys_oper_log WHERE title = '角色管理' AND business_type = 1",
      );
      const beforeCount = logsBeforeCount[0].count;

      await request(app.getHttpServer())
        .post('/system/role')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roleName: '日志测试E2E',
          roleKey: 'log_test',
          roleSort: 100,
          status: '0',
        })
        .expect(200);

      const logsAfterCount = await dataSource.query(
        "SELECT COUNT(*) as count FROM sys_oper_log WHERE title = '角色管理' AND business_type = 1",
      );
      const afterCount = logsAfterCount[0].count;

      expect(afterCount).toBeGreaterThan(beforeCount);

      // 清理测试角色
      await dataSource.query(
        "DELETE FROM sys_role WHERE role_name = '日志测试E2E'",
      );
    });
  });
});

