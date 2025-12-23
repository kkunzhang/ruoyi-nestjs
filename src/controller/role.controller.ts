import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from '../service/role.service';
import { UserService } from '../service/user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Log } from '../common/decorators/log.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseDto } from '../common/dto/response.dto';
import { RoleQueryDto } from './dto/role-query.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ChangeRoleStatusDto } from './dto/change-role-status.dto';
import { UpdateDataScopeDto } from './dto/update-data-scope.dto';
import { AuthUserQueryDto } from './dto/auth-user-query.dto';
import { AuthUserDto, CancelAuthUserDto } from './dto/auth-user.dto';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

/**
 * 角色信息控制器
 * 对应 Java 的 SysRoleController
 */
@ApiTags('角色管理')
@ApiBearerAuth()
@Controller('system/role')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly userService: UserService,
  ) {}

  /**
   * 获取角色列表
   */
  @Get('list')
  @RequirePermissions('system:role:list')
  @ApiOperation({ summary: '获取角色列表' })
  async list(@Query() query: RoleQueryDto): Promise<ResponseDto<any>> {
    const { pageNum = 1, pageSize = 10, ...roleQuery } = query;

    const [roles, total] = await this.roleService.selectRoleList(roleQuery);

    return ResponseDto.ok('查询成功', {
      rows: roles,
      total,
    });
  }

  /**
   * 导出角色数据
   */
  @Post('export')
  @RequirePermissions('system:role:export')
  @Log({ title: '角色管理', businessType: 5 }) // EXPORT = 5
  @ApiOperation({ summary: '导出角色数据' })
  @HttpCode(HttpStatus.OK)
  async export(@Body() query: RoleQueryDto): Promise<ResponseDto<any>> {
    const [roles] = await this.roleService.selectRoleList(query);
    // TODO: 实现 Excel 导出功能
    return ResponseDto.ok('导出成功', roles);
  }

  /**
   * 根据角色编号获取详细信息
   */
  @Get(':roleId')
  @RequirePermissions('system:role:query')
  @ApiOperation({ summary: '获取角色详情' })
  async getInfo(
    @Param('roleId') roleId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseDto<any>> {
    await this.roleService.checkRoleDataScope([roleId], user.userId);
    const role = await this.roleService.selectRoleById(roleId);
    return ResponseDto.ok('查询成功', role);
  }

  /**
   * 新增角色
   */
  @Post()
  @RequirePermissions('system:role:add')
  @Log({ title: '角色管理', businessType: 1 }) // INSERT = 1
  @ApiOperation({ summary: '新增角色' })
  async add(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseDto<any>> {
    // 校验角色名称唯一性
    const isRoleNameUnique = await this.roleService.checkRoleNameUnique(createRoleDto);
    if (!isRoleNameUnique) {
      throw new BadRequestException(`新增角色'${createRoleDto.roleName}'失败，角色名称已存在`);
    }

    // 校验角色权限唯一性
    const isRoleKeyUnique = await this.roleService.checkRoleKeyUnique(createRoleDto);
    if (!isRoleKeyUnique) {
      throw new BadRequestException(`新增角色'${createRoleDto.roleName}'失败，角色权限已存在`);
    }

    // 创建角色
    const role: any = {
      ...createRoleDto,
      createBy: user.userName,
    };

    const result = await this.roleService.insertRole(role);
    return result > 0
      ? ResponseDto.ok('新增成功')
      : ResponseDto.fail('新增失败');
  }

  /**
   * 修改保存角色
   */
  @Put()
  @RequirePermissions('system:role:edit')
  @Log({ title: '角色管理', businessType: 2 }) // UPDATE = 2
  @ApiOperation({ summary: '修改角色' })
  async edit(
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseDto<any>> {
    // 校验角色是否允许操作
    this.roleService.checkRoleAllowed({ roleId: updateRoleDto.roleId });

    // 校验数据权限
    await this.roleService.checkRoleDataScope([updateRoleDto.roleId], user.userId);

    // 校验角色名称唯一性
    const isRoleNameUnique = await this.roleService.checkRoleNameUnique(updateRoleDto);
    if (!isRoleNameUnique) {
      throw new BadRequestException(`修改角色'${updateRoleDto.roleName}'失败，角色名称已存在`);
    }

    // 校验角色权限唯一性
    const isRoleKeyUnique = await this.roleService.checkRoleKeyUnique(updateRoleDto);
    if (!isRoleKeyUnique) {
      throw new BadRequestException(`修改角色'${updateRoleDto.roleName}'失败，角色权限已存在`);
    }

    // 更新角色
    const role: any = {
      ...updateRoleDto,
      updateBy: user.userName,
    };

    const result = await this.roleService.updateRole(role);

    if (result > 0) {
      // TODO: 更新缓存用户权限（如果当前用户不是超级管理员）
      return ResponseDto.ok('修改成功');
    }

    throw new BadRequestException(`修改角色'${updateRoleDto.roleName}'失败，请联系管理员`);
  }

  /**
   * 修改保存数据权限
   */
  @Put('dataScope')
  @RequirePermissions('system:role:edit')
  @Log({ title: '角色管理', businessType: 2 }) // UPDATE = 2
  @ApiOperation({ summary: '修改数据权限' })
  async dataScope(
    @Body() updateDataScopeDto: UpdateDataScopeDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseDto<any>> {
    // 校验角色是否允许操作
    this.roleService.checkRoleAllowed({ roleId: updateDataScopeDto.roleId });

    // 校验数据权限
    await this.roleService.checkRoleDataScope([updateDataScopeDto.roleId], user.userId);

    // 更新数据权限
    const result = await this.roleService.authDataScope(updateDataScopeDto);

    return result > 0
      ? ResponseDto.ok('修改成功')
      : ResponseDto.fail('修改失败');
  }

  /**
   * 状态修改
   */
  @Put('changeStatus')
  @RequirePermissions('system:role:edit')
  @Log({ title: '角色管理', businessType: 2 }) // UPDATE = 2
  @ApiOperation({ summary: '修改角色状态' })
  async changeStatus(
    @Body() changeRoleStatusDto: ChangeRoleStatusDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseDto<any>> {
    // 校验角色是否允许操作
    this.roleService.checkRoleAllowed({ roleId: changeRoleStatusDto.roleId });

    // 校验数据权限
    await this.roleService.checkRoleDataScope([changeRoleStatusDto.roleId], user.userId);

    // 更新状态
    const role: any = {
      ...changeRoleStatusDto,
      updateBy: user.userName,
    };

    const result = await this.roleService.updateRoleStatus(role);

    return result > 0
      ? ResponseDto.ok('修改成功')
      : ResponseDto.fail('修改失败');
  }

  /**
   * 删除角色
   */
  @Delete(':roleIds')
  @RequirePermissions('system:role:remove')
  @Log({ title: '角色管理', businessType: 3 }) // DELETE = 3
  @ApiOperation({ summary: '删除角色' })
  async remove(@Param('roleIds') roleIdsStr: string): Promise<ResponseDto<any>> {
    const roleIds = roleIdsStr.split(',').map((id) => parseInt(id, 10));

    const result = await this.roleService.deleteRoleByIds(roleIds);

    return result > 0
      ? ResponseDto.ok('删除成功')
      : ResponseDto.fail('删除失败');
  }

  /**
   * 获取角色选择框列表
   */
  @Get('optionselect')
  @RequirePermissions('system:role:query')
  @ApiOperation({ summary: '获取角色选择框列表' })
  async optionselect(): Promise<ResponseDto<any>> {
    const roles = await this.roleService.selectRoleAll();
    return ResponseDto.ok('查询成功', roles);
  }

  /**
   * 查询已分配用户角色列表
   */
  @Get('authUser/allocatedList')
  @RequirePermissions('system:role:list')
  @ApiOperation({ summary: '查询已分配用户角色列表' })
  async allocatedList(@Query() query: AuthUserQueryDto): Promise<ResponseDto<any>> {
    const { pageNum = 1, pageSize = 10, roleId, ...userQuery } = query;

    const [users, total] = await this.userService.selectAllocatedList({
      ...userQuery,
      roleId,
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });

    return ResponseDto.ok('查询成功', {
      rows: users,
      total,
    });
  }

  /**
   * 查询未分配用户角色列表
   */
  @Get('authUser/unallocatedList')
  @RequirePermissions('system:role:list')
  @ApiOperation({ summary: '查询未分配用户角色列表' })
  async unallocatedList(@Query() query: AuthUserQueryDto): Promise<ResponseDto<any>> {
    const { pageNum = 1, pageSize = 10, roleId, ...userQuery } = query;

    const [users, total] = await this.userService.selectUnallocatedList({
      ...userQuery,
      roleId,
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });

    return ResponseDto.ok('查询成功', {
      rows: users,
      total,
    });
  }

  /**
   * 取消授权用户
   */
  @Put('authUser/cancel')
  @RequirePermissions('system:role:edit')
  @Log({ title: '角色管理', businessType: 4 }) // GRANT = 4
  @ApiOperation({ summary: '取消授权用户' })
  async cancelAuthUser(@Body() cancelAuthUserDto: CancelAuthUserDto): Promise<ResponseDto<any>> {
    const { userId, roleId } = cancelAuthUserDto;

    const result = await this.roleService.deleteAuthUser(userId, roleId);

    return result
      ? ResponseDto.ok('取消授权成功')
      : ResponseDto.fail('取消授权失败');
  }

  /**
   * 批量取消授权用户
   */
  @Put('authUser/cancelAll')
  @RequirePermissions('system:role:edit')
  @Log({ title: '角色管理', businessType: 4 }) // GRANT = 4
  @ApiOperation({ summary: '批量取消授权用户' })
  async cancelAuthUserAll(@Body() authUserDto: AuthUserDto): Promise<ResponseDto<any>> {
    const { roleId, userIds } = authUserDto;

    const result = await this.roleService.deleteAuthUsers(roleId, userIds);

    return result
      ? ResponseDto.ok('批量取消授权成功')
      : ResponseDto.fail('批量取消授权失败');
  }

  /**
   * 批量选择用户授权
   */
  @Put('authUser/selectAll')
  @RequirePermissions('system:role:edit')
  @Log({ title: '角色管理', businessType: 4 }) // GRANT = 4
  @ApiOperation({ summary: '批量选择用户授权' })
  async selectAuthUserAll(
    @Body() authUserDto: AuthUserDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseDto<any>> {
    const { roleId, userIds } = authUserDto;

    // 校验数据权限
    await this.roleService.checkRoleDataScope([roleId], user.userId);

    const result = await this.roleService.insertAuthUsers(roleId, userIds);

    return result
      ? ResponseDto.ok('批量授权成功')
      : ResponseDto.fail('批量授权失败');
  }

  /**
   * 获取对应角色部门树列表
   */
  @Get('deptTree/:roleId')
  @RequirePermissions('system:role:query')
  @ApiOperation({ summary: '获取角色部门树列表' })
  async deptTree(@Param('roleId') roleId: number): Promise<ResponseDto<any>> {
    // TODO: 实现部门树查询逻辑
    // const checkedKeys = await this.deptService.selectDeptListByRoleId(roleId);
    // const depts = await this.deptService.selectDeptTreeList({});

    return ResponseDto.ok('查询成功', {
      checkedKeys: [], // 已选中的部门ID列表
      depts: [], // 部门树列表
    });
  }
}

