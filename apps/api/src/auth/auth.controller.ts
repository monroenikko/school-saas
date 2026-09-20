import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterSchoolDto } from './dto/register-school.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { ApiResponse, AuthTokens, AuthUser, JwtPayload } from '@school-saas/shared';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @SwaggerResponse({ status: 200, description: 'User successfully logged in, returns tokens and profile' })
  @SwaggerResponse({ status: 401, description: 'Invalid email or password' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>> {
    const result = await this.authService.login(loginDto);
    this.setAuthCookies(res, result.tokens);

    return {
      success: true,
      message: 'Logged in successfully',
      data: result,
    };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new school tenant and provision admin account' })
  @SwaggerResponse({ status: 201, description: 'School successfully created and initialized' })
  @SwaggerResponse({ status: 409, description: 'School slug or admin email already exists' })
  async register(
    @Body() registerDto: RegisterSchoolDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>> {
    const result = await this.authService.registerSchool(registerDto);
    this.setAuthCookies(res, result.tokens);

    return {
      success: true,
      message: 'School registered successfully',
      data: result,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT access token using refresh token' })
  @SwaggerResponse({ status: 200, description: 'New token pair generated' })
  @SwaggerResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>> {
    const token = req.cookies?.['refresh_token'] || dto.refreshToken;

    if (!token) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const result = await this.authService.refreshTokens(token);
    this.setAuthCookies(res, result.tokens);

    return {
      success: true,
      message: 'Tokens refreshed',
      data: result,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and clear authentication cookies' })
  async logout(@Res({ passthrough: true }) res: Response): Promise<ApiResponse<null>> {
    this.clearAuthCookies(res);
    return {
      success: true,
      message: 'Logged out successfully',
      data: null,
    };
  }

  @ApiBearerAuth('JWT-auth')
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current authenticated user profile and permissions' })
  @SwaggerResponse({ status: 200, description: 'Current user profile with role and tenant information' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: JwtPayload): Promise<ApiResponse<AuthUser & { permissions: string[] }>> {
    const profile = await this.authService.getProfile(user.sub);
    return {
      success: true,
      data: {
        ...profile,
        permissions: user.permissions || [],
      },
    };
  }

  private setAuthCookies(res: Response, tokens: AuthTokens) {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    };

    res.cookie('access_token', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    if (tokens.refreshToken) {
      res.cookie('refresh_token', tokens.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }
  }

  private clearAuthCookies(res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    };

    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
  }
}
