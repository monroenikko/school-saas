import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ATTENDANCE';
  timestamp: string;
  read: boolean;
}

export interface NotificationsState {
  unreadCount: number;
  alerts: AlertItem[];
}

const initialState: NotificationsState = {
  unreadCount: 3,
  alerts: [
    {
      id: 'alert-1',
      title: 'Gate In: Juan Dela Cruz',
      message: 'Student checked in at Turnstile Main Gate 1 at 07:15 AM.',
      type: 'ATTENDANCE',
      timestamp: 'Just now',
      read: false,
    },
    {
      id: 'alert-2',
      title: 'Quarterly Report Cards Ready',
      message: 'Grading period for Q1 has been closed and locked.',
      type: 'INFO',
      timestamp: '15m ago',
      read: false,
    },
    {
      id: 'alert-3',
      title: 'Tuition Payment Received',
      message: 'Official Receipt #OR-92817 confirmed via GCash.',
      type: 'SUCCESS',
      timestamp: '1h ago',
      read: false,
    },
  ],
};

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    decrementUnreadCount: (state) => {
      if (state.unreadCount > 0) state.unreadCount -= 1;
    },
    addAlert: (state, action: PayloadAction<AlertItem>) => {
      state.alerts.unshift(action.payload);
      state.unreadCount += 1;
    },
    markAlertAsRead: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find((a) => a.id === action.payload);
      if (alert && !alert.read) {
        alert.read = true;
        if (state.unreadCount > 0) state.unreadCount -= 1;
      }
    },
    clearAllAlerts: (state) => {
      state.alerts = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  setUnreadCount,
  decrementUnreadCount,
  addAlert,
  markAlertAsRead,
  clearAllAlerts,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
