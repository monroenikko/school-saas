import { describe, it, expect } from 'vitest';
import { makeStore } from '../store';
import { setSidebarCollapsed } from '../slices/ui-slice';
import { setUnreadCount } from '../slices/notifications-slice';

describe('Redux Store Factory (makeStore)', () => {
  it('creates an independent Redux store instance with all registered slices', () => {
    const store = makeStore();
    const state = store.getState();

    expect(state).toHaveProperty('auth');
    expect(state).toHaveProperty('ui');
    expect(state).toHaveProperty('notifications');
    expect(state).toHaveProperty('attendance');
  });

  it('guarantees store instances are isolated (SSR per-request store safety)', () => {
    const store1 = makeStore();
    const store2 = makeStore();

    store1.dispatch(setSidebarCollapsed(true));
    store1.dispatch(setUnreadCount(99));

    // store1 has updated state
    expect(store1.getState().ui.sidebarCollapsed).toBe(true);
    expect(store1.getState().notifications.unreadCount).toBe(99);

    // store2 remains pristine at default initial state
    expect(store2.getState().ui.sidebarCollapsed).toBe(false);
    expect(store2.getState().notifications.unreadCount).toBe(3);
  });
});
