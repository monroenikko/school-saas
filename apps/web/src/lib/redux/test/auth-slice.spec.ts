import { describe, it, expect } from 'vitest';
import authReducer, {
  setCredentials,
  clearCredentials,
  setLoading,
  setTenantContext,
  AuthState,
} from '../slices/auth-slice';
import { Role } from '@school-saas/shared';

describe('authSlice', () => {
  const initialState: AuthState = {
    user: null,
    token: null,
    tenant: null,
    isAuthenticated: false,
    isLoading: true,
  };

  it('should return initial state when passed an empty action', () => {
    expect(authReducer(undefined, { type: '' })).toEqual(initialState);
  });

  it('should handle setCredentials', () => {
    const mockUser = {
      id: 'user-1',
      email: 'admin@school.edu.ph',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      role: Role.SCHOOL_ADMIN,
      tenantId: 'tenant-123',
      tenantName: 'St. Jude International Academy',
      permissions: ['ALL'],
    };

    const nextState = authReducer(
      initialState,
      setCredentials({ user: mockUser, token: 'jwt-mock-token' }),
    );

    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.isLoading).toBe(false);
    expect(nextState.user).toEqual(mockUser);
    expect(nextState.token).toBe('jwt-mock-token');
    expect(nextState.tenant?.name).toBe('St. Jude International Academy');
  });

  it('should handle clearCredentials (logout)', () => {
    const loggedInState: AuthState = {
      user: {
        id: 'user-1',
        email: 'admin@school.edu.ph',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        role: Role.SCHOOL_ADMIN,
        tenantId: 'tenant-123',
      },
      token: 'jwt-mock-token',
      tenant: { id: 'tenant-123', name: 'St. Jude Academy', slug: 'st-jude' },
      isAuthenticated: true,
      isLoading: false,
    };

    const nextState = authReducer(loggedInState, clearCredentials());

    expect(nextState.isAuthenticated).toBe(false);
    expect(nextState.user).toBeNull();
    expect(nextState.token).toBeNull();
    expect(nextState.tenant).toBeNull();
  });

  it('should handle setLoading', () => {
    const state = authReducer(initialState, setLoading(false));
    expect(state.isLoading).toBe(false);
  });

  it('should handle setTenantContext for super admin switching', () => {
    const tenantPayload = {
      id: 'tenant-456',
      name: 'Oakwood Academy',
      slug: 'oakwood',
    };
    const state = authReducer(initialState, setTenantContext(tenantPayload));
    expect(state.tenant).toEqual(tenantPayload);
  });
});
