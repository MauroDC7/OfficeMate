export const WORKDAY_INDICES = [0, 1, 2, 3, 4] as const;
export const WEEKDAY_INDICES = [0, 1, 2, 3, 4, 5, 6] as const;

export const MINUTES_IN_HOUR = 60;
export const MINUTES_IN_DAY = 24 * MINUTES_IN_HOUR;

export const SLOT_MINUTES = 30;

/** Pixel height per 30-minute slot in the week timeline (fixed). */
export const SLOT_HEIGHT_PX = 36;

/** @deprecated Use gridTemplateColumnsForDayCount for dynamic column counts. */
export const GRID_TEMPLATE =
    'grid-cols-[minmax(3rem,3.75rem)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]';

export function gridTemplateColumnsForDayCount(dayCount: number): string {
    return `minmax(3rem, 3.75rem) repeat(${dayCount}, minmax(0, 1fr))`;
}
