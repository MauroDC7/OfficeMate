export const DAY_MS = 86_400_000;
export const WORKDAY_INDICES = [0, 1, 2, 3, 4] as const;
export const MINUTES_IN_DAY = 24 * 60;
export const SLOT_MINUTES = 30;
export const DISPLAY_DAY_START_MIN = 7 * 60;
export const DISPLAY_DAY_END_MIN = MINUTES_IN_DAY;
export const DISPLAY_MINUTES_SPAN = DISPLAY_DAY_END_MIN - DISPLAY_DAY_START_MIN;
export const DISPLAY_SLOT_COUNT = DISPLAY_MINUTES_SPAN / SLOT_MINUTES;
export const DISPLAY_HOUR_INDICES = Array.from({ length: 24 - 7 }, (_, i) => 7 + i);
export const SLOT_HEIGHT_OPTIONS = [28, 36, 44] as const;
export const GRID_TEMPLATE =
    'grid-cols-[minmax(3rem,3.75rem)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]';
