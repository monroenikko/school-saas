import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthUser } from '@school-saas/shared';

export interface TenantContext {
  id: string;
  name: string;
  slug: string;
}

export interface AuthState {
  user: (AuthUser & { permissions?: string[] }) | null;
  token: string | null;
  tenant: TenantContext | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  tenant: null,
  isAuthenticated: false,
  isLoading: true,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: AuthUser & { permissions?: string[] };
        token?: string;
      }>,
    ) => {
      state.user = action.payload.user;
      if (action.payload.token) {
        state.token = action.payload.token;
      }
      state.isAuthenticated = true;
      state.isLoading = false;
      if (action.payload.user.tenantId) {
        state.tenant = {
          id: action.payload.user.tenantId,
          name: action.payload.user.tenantName || 'School Campus',
          slug: (action.payload.user.tenantName || 'school').toLowerCase().replace(/\s+/g, '-'),
        };
      }
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.tenant = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setTenantContext: (state, action: PayloadAction<TenantContext>) => {
      state.tenant = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setLoading, setTenantContext } =
  authSlice.actions;

export default authSlice.reducer;
