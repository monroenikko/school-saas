import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Users & Staff Access Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('stats')
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get staff account counts and activation statistics' })
  @ApiResponse({ status: 200, description: 'User statistics returned successfully' })
  async getUserStats(@Req() req: any) {
    const stats = await this.usersService.getUserStats(req.tenantId);
    return {
      success: true,
      data: stats,
    };
  }

  @Get()
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get list of staff users (paginated and filterable)' })
  @ApiResponse({ status: 200, description: 'Users list returned' })
  async getUsers(@Req() req: any, @Query() query: QueryUsersDto) {
    const result = await this.usersService.getUsers(req.tenantId, query);
    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get single staff profile detail' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User detail returned' })
  async getUserById(@Req() req: any, @Param('id') id: string) {
    const user = await this.usersService.getUserById(req.tenantId, id);
    return {
      success: true,
      data: user,
    };
  }

  @Post()
  @Permissions('users:manage')
  @ApiOperation({ summary: 'Create a new staff or school administrator account' })
  @ApiResponse({ status: 201, description: 'Staff account created successfully' })
  async createUser(@Req() req: any, @Body() dto: CreateUserDto) {
    return this.usersService.createUser(req.tenantId, dto);
  }

  @Patch(':id')
  @Permissions('users:manage')
  @ApiOperation({ summary: 'Update staff account name, role, or activation status' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  async updateUser(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(req.tenantId, id, dto);
  }

  @Patch(':id/reset-password')
  @Permissions('users:manage')
  @ApiOperation({ summary: 'Reset a staff account password' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.usersService.resetPassword(req.tenantId, id, dto.newPassword);
  }

  @Delete(':id')
  @Permissions('users:manage')
  @ApiOperation({ summary: 'Deactivate a staff account' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Account deactivated' })
  async deleteUser(@Req() req: any, @Param('id') id: string) {
    return this.usersService.deleteUser(req.tenantId, id);
  }
}
