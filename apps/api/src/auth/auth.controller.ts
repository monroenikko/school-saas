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
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterSchoolDto } from './dto/register-school.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { ApiResponse, AuthTokens, AuthUser, JwtPayload } from '@school-saas/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
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
  async logout(@Res({ passthrough: true }) res: Response): Promise<ApiResponse<null>> {
    this.clearAuthCookies(res);
    return {
      success: true,
      message: 'Logged out successfully',
      data: null,
    };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
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
