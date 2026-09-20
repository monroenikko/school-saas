import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth-slice';
import uiReducer from './slices/ui-slice';
import notificationsReducer from './slices/notifications-slice';
import attendanceReducer from './slices/attendance-slice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      notifications: notificationsReducer,
      attendance: attendanceReducer,
    },
    devTools: process.env.NODE_ENV !== 'production',
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
