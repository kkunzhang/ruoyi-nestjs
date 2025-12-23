import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '../service/user.service';
import { ResponseDto, PageResponseDto } from '../common/dto/response.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPwdDto } from './dto/reset-pwd.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { AuthRoleDto } from './dto/auth-role.dto';
import { SysUser } from '../domain/entities/sys-user.entity';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Log, BusinessType } from '../common/decorators/log.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * 用户信息 Controller
 * 对应 Java 的 SysUserController
 */
@ApiTags('用户管理')
@ApiBearerAuth()
@Controller('system/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取用户列表
   */
  @Get('list')
  @RequirePermissions('system:user:list')
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResponse({ status: 200, description: '查询成功', type: PageResponseDto })
  async list(@Query() query: UserQueryDto): Promise<PageResponseDto<SysUser>> {
    const { pageNum = 1, pageSize = 10, beginTime, endTime, ...filters } = query;
    const skip = (pageNum - 1) * pageSize;

    const [list, total] = await this.userService.selectUserList({
      ...filters,
      beginTime: beginTime ? new Date(beginTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      skip,
      take: pageSize,
    });

    return new PageResponseDto(list, total);
  }

  /**
   * 获取用户初始化信息（新增/编辑页面）
   */
  @Get()
  @ApiOperation({ summary: '获取用户初始化信息' })
  @ApiResponse({ status: 200, description: '查询成功', type: ResponseDto })
  async getInitInfo(): Promise<ResponseDto> {
    const data: any = {};

    // TODO: 获取所有角色和岗位
    // const roles = await roleService.selectRoleAll();
    // data.roles = roles.filter(r => r.roleId !== 1); // 排除超级管理员角色
    // data.posts = await postService.selectPostAll();

    return ResponseDto.success(data);
  }

  /**
   * 根据用户编号获取详细信息
   */
  @Get(':userId')
  @ApiOperation({ summary: '获取用户详细信息' })
  @ApiResponse({ status: 200, description: '查询成功', type: ResponseDto })
  async getInfo(@Param('userId', ParseIntPipe) userId: number): Promise<ResponseDto> {
    // TODO: 检查数据权限 checkUserDataScope
    const user = await this.userService.selectUserById(userId);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    const data: any = {
      data: user,
      roleIds: user.roles?.map((role) => role.roleId) || [],
    };

    // TODO: 获取用户的岗位ID列表
    // data.postIds = await postService.selectPostListByUserId(userId);

    // TODO: 获取所有角色和岗位
    // const roles = await roleService.selectRoleAll();
    // data.roles = userId === 1 ? roles : roles.filter(r => r.roleId !== 1);
    // data.posts = await postService.selectPostAll();

    return ResponseDto.success(data);
  }

  /**
   * 新增用户
   */
  @Post()
  @RequirePermissions('system:user:add')
  @Log({ title: '用户管理', businessType: BusinessType.INSERT })
  @ApiOperation({ summary: '新增用户' })
  @ApiResponse({ status: 200, description: '新增成功', type: ResponseDto })
  async add(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser('userName') currentUserName: string,
  ): Promise<ResponseDto> {
    // TODO: 检查部门数据权限 deptService.checkDeptDataScope
    // TODO: 检查角色数据权限 roleService.checkRoleDataScope

    // 校验用户名唯一性
    const isUserNameUnique = await this.userService.checkUserNameUnique({
      userName: createUserDto.userName,
    });
    if (!isUserNameUnique) {
      throw new BadRequestException(
        `新增用户'${createUserDto.userName}'失败，登录账号已存在`,
      );
    }

    // 校验手机号唯一性
    if (createUserDto.phonenumber) {
      const isPhoneUnique = await this.userService.checkPhoneUnique({
        phonenumber: createUserDto.phonenumber,
      });
      if (!isPhoneUnique) {
        throw new BadRequestException(
          `新增用户'${createUserDto.userName}'失败，手机号码已存在`,
        );
      }
    }

    // 校验邮箱唯一性
    if (createUserDto.email) {
      const isEmailUnique = await this.userService.checkEmailUnique({
        email: createUserDto.email,
      });
      if (!isEmailUnique) {
        throw new BadRequestException(
          `新增用户'${createUserDto.userName}'失败，邮箱账号已存在`,
        );
      }
    }

    // 设置创建人
    const userWithCreator = {
      ...createUserDto,
      createBy: currentUserName,
    };

    const result = await this.userService.insertUser(userWithCreator);
    return ResponseDto.success(result, '新增成功');
  }

  /**
   * 修改用户
   */
  @Put()
  @RequirePermissions('system:user:edit')
  @Log({ title: '用户管理', businessType: BusinessType.UPDATE })
  @ApiOperation({ summary: '修改用户' })
  @ApiResponse({ status: 200, description: '修改成功', type: ResponseDto })
  async edit(
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('userName') currentUserName: string,
  ): Promise<ResponseDto> {
    // 校验用户是否允许操作
    this.userService.checkUserAllowed({ userId: updateUserDto.userId });

    // TODO: 检查数据权限 checkUserDataScope
    // TODO: 检查部门数据权限 deptService.checkDeptDataScope
    // TODO: 检查角色数据权限 roleService.checkRoleDataScope

    // 校验用户名唯一性
    const isUserNameUnique = await this.userService.checkUserNameUnique({
      userId: updateUserDto.userId,
      userName: updateUserDto.userName,
    });
    if (!isUserNameUnique) {
      throw new BadRequestException(
        `修改用户'${updateUserDto.userName}'失败，登录账号已存在`,
      );
    }

    // 校验手机号唯一性
    if (updateUserDto.phonenumber) {
      const isPhoneUnique = await this.userService.checkPhoneUnique({
        userId: updateUserDto.userId,
        phonenumber: updateUserDto.phonenumber,
      });
      if (!isPhoneUnique) {
        throw new BadRequestException(
          `修改用户'${updateUserDto.userName}'失败，手机号码已存在`,
        );
      }
    }

    // 校验邮箱唯一性
    if (updateUserDto.email) {
      const isEmailUnique = await this.userService.checkEmailUnique({
        userId: updateUserDto.userId,
        email: updateUserDto.email,
      });
      if (!isEmailUnique) {
        throw new BadRequestException(
          `修改用户'${updateUserDto.userName}'失败，邮箱账号已存在`,
        );
      }
    }

    // 设置更新人
    const userWithUpdater = {
      ...updateUserDto,
      updateBy: currentUserName,
    };

    const result = await this.userService.updateUser(userWithUpdater);
    return ResponseDto.success(result, '修改成功');
  }

  /**
   * 删除用户
   */
  @Delete(':userIds')
  @RequirePermissions('system:user:remove')
  @Log({ title: '用户管理', businessType: BusinessType.DELETE })
  @ApiOperation({ summary: '删除用户' })
  @ApiResponse({ status: 200, description: '删除成功', type: ResponseDto })
  async remove(
    @Param('userIds') userIds: string,
    @CurrentUser('userId') currentUserId: number,
  ): Promise<ResponseDto> {
    const userIdArray = userIds.split(',').map((id) => parseInt(id, 10));

    // 检查是否删除当前用户
    if (userIdArray.includes(currentUserId)) {
      throw new BadRequestException('当前用户不能删除');
    }

    const result = await this.userService.deleteUserByIds(userIdArray);
    return ResponseDto.success(result, '删除成功');
  }

  /**
   * 重置密码
   */
  @Put('resetPwd')
  @ApiOperation({ summary: '重置密码' })
  @ApiResponse({ status: 200, description: '重置成功', type: ResponseDto })
  async resetPwd(@Body() resetPwdDto: ResetPwdDto): Promise<ResponseDto> {
    // 校验用户是否允许操作
    this.userService.checkUserAllowed({ userId: resetPwdDto.userId });

    // TODO: 检查数据权限 checkUserDataScope
    // TODO: 设置更新人 updateBy = getUsername();

    const result = await this.userService.resetPwd(
      resetPwdDto.userId,
      resetPwdDto.password,
    );
    return ResponseDto.success(result, '重置成功');
  }

  /**
   * 状态修改
   */
  @Put('changeStatus')
  @ApiOperation({ summary: '修改用户状态' })
  @ApiResponse({ status: 200, description: '修改成功', type: ResponseDto })
  async changeStatus(@Body() changeStatusDto: ChangeStatusDto): Promise<ResponseDto> {
    // 校验用户是否允许操作
    this.userService.checkUserAllowed({ userId: changeStatusDto.userId });

    // TODO: 检查数据权限 checkUserDataScope
    // TODO: 设置更新人 updateBy = getUsername();

    const result = await this.userService.updateUserStatus(
      changeStatusDto.userId,
      changeStatusDto.status,
    );
    return ResponseDto.success(result, '修改成功');
  }

  /**
   * 根据用户编号获取授权角色
   */
  @Get('authRole/:userId')
  @ApiOperation({ summary: '获取用户授权角色' })
  @ApiResponse({ status: 200, description: '查询成功', type: ResponseDto })
  async authRole(@Param('userId', ParseIntPipe) userId: number): Promise<ResponseDto> {
    const user = await this.userService.selectUserById(userId);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    // TODO: 获取用户的角色列表
    // const roles = await roleService.selectRolesByUserId(userId);
    // const filteredRoles = userId === 1 ? roles : roles.filter(r => r.roleId !== 1);

    const data = {
      user,
      // roles: filteredRoles,
    };

    return ResponseDto.success(data);
  }

  /**
   * 用户授权角色
   */
  @Put('authRole')
  @ApiOperation({ summary: '用户授权角色' })
  @ApiResponse({ status: 200, description: '授权成功', type: ResponseDto })
  async insertAuthRole(@Body() authRoleDto: AuthRoleDto): Promise<ResponseDto> {
    // TODO: 检查数据权限 checkUserDataScope
    // TODO: 检查角色数据权限 roleService.checkRoleDataScope

    await this.userService.insertUserAuth(authRoleDto.userId, authRoleDto.roleIds);
    return ResponseDto.success(null, '授权成功');
  }

  /**
   * 获取部门树列表
   */
  @Get('deptTree')
  @ApiOperation({ summary: '获取部门树列表' })
  @ApiResponse({ status: 200, description: '查询成功', type: ResponseDto })
  async deptTree(): Promise<ResponseDto> {
    // TODO: 实现部门树查询
    // const tree = await deptService.selectDeptTreeList(dept);
    return ResponseDto.success([]);
  }
}

