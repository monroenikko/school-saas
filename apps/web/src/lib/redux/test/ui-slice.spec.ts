import { describe, it, expect } from 'vitest';
import uiReducer, {
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileSidebar,
  setMobileSidebarOpen,
  setActiveAcademicYear,
  toggleNotificationsDrawer,
  setNotificationsDrawerOpen,
  setTheme,
  UiState,
} from '../slices/ui-slice';

describe('uiSlice', () => {
  const initialState: UiState = {
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    activeAcademicYear: '2026-2027',
    isNotificationsDrawerOpen: false,
    activeTheme: 'light',
  };

  it('should return initial state when passed an empty action', () => {
    expect(uiReducer(undefined, { type: '' })).toEqual(initialState);
  });

  it('should toggle sidebar collapsed state', () => {
    const s1 = uiReducer(initialState, toggleSidebar());
    expect(s1.sidebarCollapsed).toBe(true);

    const s2 = uiReducer(s1, toggleSidebar());
    expect(s2.sidebarCollapsed).toBe(false);
  });

  it('should set sidebar collapsed directly', () => {
    const state = uiReducer(initialState, setSidebarCollapsed(true));
    expect(state.sidebarCollapsed).toBe(true);
  });

  it('should toggle and set mobile sidebar open state', () => {
    const s1 = uiReducer(initialState, toggleMobileSidebar());
    expect(s1.mobileSidebarOpen).toBe(true);

    const s2 = uiReducer(s1, setMobileSidebarOpen(false));
    expect(s2.mobileSidebarOpen).toBe(false);
  });

  it('should set active academic year', () => {
    const state = uiReducer(initialState, setActiveAcademicYear('2027-2028'));
    expect(state.activeAcademicYear).toBe('2027-2028');
  });

  it('should toggle notifications drawer', () => {
    const s1 = uiReducer(initialState, toggleNotificationsDrawer());
    expect(s1.isNotificationsDrawerOpen).toBe(true);

    const s2 = uiReducer(s1, setNotificationsDrawerOpen(false));
    expect(s2.isNotificationsDrawerOpen).toBe(false);
  });

  it('should set theme', () => {
    const state = uiReducer(initialState, setTheme('dark'));
    expect(state.activeTheme).toBe('dark');
  });
});
