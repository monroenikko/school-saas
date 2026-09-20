import { describe, it, expect } from 'vitest';
import attendanceReducer, {
  setSelectedDate,
  setSelectedSectionId,
  setSelectedGateDeviceId,
  toggleLiveFeed,
  setLiveFeedPaused,
  AttendanceState,
} from '../slices/attendance-slice';

describe('attendanceSlice', () => {
  it('should return initial state with today date and active live feed', () => {
    const state = attendanceReducer(undefined, { type: '' });
    expect(state.selectedSectionId).toBe('all');
    expect(state.isLiveFeedPaused).toBe(false);
    expect(state.selectedGateDeviceId).toBe('all');
  });

  it('should set selected date', () => {
    const state = attendanceReducer(undefined, setSelectedDate('2026-10-15'));
    expect(state.selectedDate).toBe('2026-10-15');
  });

  it('should set selected section id', () => {
    const state = attendanceReducer(undefined, setSelectedSectionId('sec-diamond'));
    expect(state.selectedSectionId).toBe('sec-diamond');
  });

  it('should set selected gate device id', () => {
    const state = attendanceReducer(undefined, setSelectedGateDeviceId('device-turnstile-1'));
    expect(state.selectedGateDeviceId).toBe('device-turnstile-1');
  });

  it('should toggle and set live feed paused', () => {
    let state = attendanceReducer(undefined, toggleLiveFeed());
    expect(state.isLiveFeedPaused).toBe(true);

    state = attendanceReducer(state, setLiveFeedPaused(false));
    expect(state.isLiveFeedPaused).toBe(false);
  });
});
