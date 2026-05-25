import {
    MINUTES_IN_DAY,
    MINUTES_IN_HOUR,
    SLOT_MINUTES,
} from '@/components/timesheets/timesheet-grid-config';
import { parseTimeInputToMinutes } from '@/components/timesheets/timesheet-helpers';

export type TimesheetGridDisplay = {
    dayStartMin: number;
    dayEndMin: number;
    minutesSpan: number;
    slotCount: number;
    hourIndices: number[];
};

export const DEFAULT_DAY_START_MIN = 0;
export const DEFAULT_DAY_END_MIN = MINUTES_IN_DAY;

const STORAGE_KEY = 'timetraq.timesheet.displayRange';

/** Stored hour slot: '' = default (full day), otherwise '0'–'23'. */
export type StoredDisplayRangeHours = {
    start: string;
    end: string;
};

export const DISPLAY_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour);

function normalizeStoredHour(value: string): string {
    const trimmed = value.trim();

    if (trimmed === '') {
        return '';
    }

    if (/^\d{1,2}$/.test(trimmed)) {
        const hour = Number.parseInt(trimmed, 10);

        if (hour >= 0 && hour <= 23) {
            return String(hour);
        }
    }

    const parsed = parseTimeInputToMinutes(trimmed);

    if (parsed === null) {
        return '';
    }

    const hour = Math.floor(parsed / MINUTES_IN_HOUR);

    if (hour >= 0 && hour <= 23) {
        return String(hour);
    }

    return '';
}

export function loadDisplayRangeHours(): StoredDisplayRangeHours {
    if (typeof window === 'undefined') {
        return { start: '', end: '' };
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (raw === null || raw === '') {
            return { start: '', end: '' };
        }

        const parsed = JSON.parse(raw) as StoredDisplayRangeHours;

        return {
            start: normalizeStoredHour(
                typeof parsed.start === 'string' ? parsed.start : '',
            ),
            end: normalizeStoredHour(
                typeof parsed.end === 'string' ? parsed.end : '',
            ),
        };
    } catch {
        return { start: '', end: '' };
    }
}

export function saveDisplayRangeHours(hours: StoredDisplayRangeHours): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(hours));
}

export function resolveDisplayStartMinutes(startHour: string): number {
    const trimmed = startHour.trim();

    if (trimmed === '') {
        return DEFAULT_DAY_START_MIN;
    }

    const hour = Number.parseInt(trimmed, 10);

    if (Number.isNaN(hour) || hour < 0 || hour > 23) {
        return DEFAULT_DAY_START_MIN;
    }

    return hour * MINUTES_IN_HOUR;
}

export function resolveDisplayEndMinutes(endHour: string): number {
    const trimmed = endHour.trim();

    if (trimmed === '') {
        return DEFAULT_DAY_END_MIN;
    }

    const hour = Number.parseInt(trimmed, 10);

    if (Number.isNaN(hour) || hour < 0 || hour > 23) {
        return DEFAULT_DAY_END_MIN;
    }

    return Math.min((hour + 1) * MINUTES_IN_HOUR, MINUTES_IN_DAY);
}

export function buildGridDisplay(
    dayStartMin: number,
    dayEndMin: number,
): TimesheetGridDisplay {
    let start = Math.max(0, Math.min(dayStartMin, MINUTES_IN_DAY - SLOT_MINUTES));
    let end = Math.max(start + SLOT_MINUTES, Math.min(dayEndMin, MINUTES_IN_DAY));

    if (end <= start) {
        end = Math.min(start + MINUTES_IN_HOUR, MINUTES_IN_DAY);
    }

    const minutesSpan = end - start;
    const slotCount = minutesSpan / SLOT_MINUTES;
    const firstHour = Math.floor(start / MINUTES_IN_HOUR);
    const lastHourExclusive = Math.ceil(end / MINUTES_IN_HOUR);
    const hourIndices = Array.from(
        { length: lastHourExclusive - firstHour },
        (_, index) => firstHour + index,
    );

    return {
        dayStartMin: start,
        dayEndMin: end,
        minutesSpan,
        slotCount,
        hourIndices,
    };
}

export const DEFAULT_GRID_DISPLAY = buildGridDisplay(
    DEFAULT_DAY_START_MIN,
    DEFAULT_DAY_END_MIN,
);

export function formatHourOptionLabel(hour: number): string {
    return `${String(hour).padStart(2, '0')}:00`;
}
