export const WORKDAY_INDICES = [0, 1, 2, 3, 4] as const;

export const MINUTES_IN_HOUR = 60;
export const MINUTES_IN_DAY = 24 * MINUTES_IN_HOUR;

export const SLOT_MINUTES = 30;

export const DISPLAY_DAY_START_MIN = 7 * MINUTES_IN_HOUR;
export const DISPLAY_DAY_END_MIN = MINUTES_IN_DAY;
export const DISPLAY_MINUTES_SPAN = DISPLAY_DAY_END_MIN - DISPLAY_DAY_START_MIN;
export const DISPLAY_SLOT_COUNT = DISPLAY_MINUTES_SPAN / SLOT_MINUTES;

const FIRST_DISPLAY_HOUR = DISPLAY_DAY_START_MIN / MINUTES_IN_HOUR;
const LAST_DISPLAY_HOUR = DISPLAY_DAY_END_MIN / MINUTES_IN_HOUR;
export const DISPLAY_HOUR_INDICES = Array.from(
    { length: LAST_DISPLAY_HOUR - FIRST_DISPLAY_HOUR },
    (_, i) => FIRST_DISPLAY_HOUR + i,
);

/** Pixel height per 30-minute slot in the week timeline (fixed). */
export const SLOT_HEIGHT_PX = 36;

export const GRID_TEMPLATE =
    'grid-cols-[minmax(3rem,3.75rem)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]';
