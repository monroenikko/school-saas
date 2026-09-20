import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UiState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  activeAcademicYear: string;
  isNotificationsDrawerOpen: boolean;
  activeTheme: 'light' | 'dark' | 'system';
}

const initialState: UiState = {
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  activeAcademicYear: '2026-2027',
  isNotificationsDrawerOpen: false,
  activeTheme: 'light',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleMobileSidebar: (state) => {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    setMobileSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileSidebarOpen = action.payload;
    },
    setActiveAcademicYear: (state, action: PayloadAction<string>) => {
      state.activeAcademicYear = action.payload;
    },
    toggleNotificationsDrawer: (state) => {
      state.isNotificationsDrawerOpen = !state.isNotificationsDrawerOpen;
    },
    setNotificationsDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.isNotificationsDrawerOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.activeTheme = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileSidebar,
  setMobileSidebarOpen,
  setActiveAcademicYear,
  toggleNotificationsDrawer,
  setNotificationsDrawerOpen,
  setTheme,
} = uiSlice.actions;

export default uiSlice.reducer;
