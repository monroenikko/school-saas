import { describe, it, expect } from 'vitest';
import notificationsReducer, {
  setUnreadCount,
  decrementUnreadCount,
  addAlert,
  markAlertAsRead,
  clearAllAlerts,
  AlertItem,
  NotificationsState,
} from '../slices/notifications-slice';

describe('notificationsSlice', () => {
  it('should return initial state with default alerts', () => {
    const state = notificationsReducer(undefined, { type: '' });
    expect(state.unreadCount).toBe(3);
    expect(state.alerts.length).toBe(3);
  });

  it('should set unread count', () => {
    const state = notificationsReducer(undefined, setUnreadCount(5));
    expect(state.unreadCount).toBe(5);
  });

  it('should decrement unread count without going below zero', () => {
    let state = notificationsReducer(undefined, setUnreadCount(1));
    state = notificationsReducer(state, decrementUnreadCount());
    expect(state.unreadCount).toBe(0);

    state = notificationsReducer(state, decrementUnreadCount());
    expect(state.unreadCount).toBe(0);
  });

  it('should prepend a new alert and increment unread count', () => {
    const newAlert: AlertItem = {
      id: 'alert-new',
      title: 'Gate In Alert',
      message: 'Student arrived at gate',
      type: 'ATTENDANCE',
      timestamp: 'Now',
      read: false,
    };

    const state = notificationsReducer(undefined, addAlert(newAlert));
    expect(state.alerts[0].id).toBe('alert-new');
    expect(state.unreadCount).toBe(4);
  });

  it('should mark an alert as read and decrement unread count', () => {
    let state = notificationsReducer(undefined, { type: '' });
    expect(state.unreadCount).toBe(3);

    state = notificationsReducer(state, markAlertAsRead('alert-1'));
    expect(state.alerts.find((a) => a.id === 'alert-1')?.read).toBe(true);
    expect(state.unreadCount).toBe(2);

    // Marking same alert again should not decrement further
    state = notificationsReducer(state, markAlertAsRead('alert-1'));
    expect(state.unreadCount).toBe(2);
  });

  it('should clear all alerts', () => {
    const state = notificationsReducer(undefined, clearAllAlerts());
    expect(state.alerts).toEqual([]);
    expect(state.unreadCount).toBe(0);
  });
});
