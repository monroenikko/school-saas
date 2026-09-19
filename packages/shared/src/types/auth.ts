import { Role } from '../enums/roles';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: Role;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  tenantId: string;
  tenantName?: string;
  avatarUrl?: string | null;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}
