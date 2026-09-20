import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AttendanceState {
  selectedDate: string;
  selectedSectionId: string | 'all';
  isLiveFeedPaused: boolean;
  selectedGateDeviceId: string | 'all';
}

const initialState: AttendanceState = {
  selectedDate: new Date().toISOString().split('T')[0],
  selectedSectionId: 'all',
  isLiveFeedPaused: false,
  selectedGateDeviceId: 'all',
};

export const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setSelectedSectionId: (state, action: PayloadAction<string>) => {
      state.selectedSectionId = action.payload;
    },
    setSelectedGateDeviceId: (state, action: PayloadAction<string>) => {
      state.selectedGateDeviceId = action.payload;
    },
    toggleLiveFeed: (state) => {
      state.isLiveFeedPaused = !state.isLiveFeedPaused;
    },
    setLiveFeedPaused: (state, action: PayloadAction<boolean>) => {
      state.isLiveFeedPaused = action.payload;
    },
  },
});

export const {
  setSelectedDate,
  setSelectedSectionId,
  setSelectedGateDeviceId,
  toggleLiveFeed,
  setLiveFeedPaused,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;
