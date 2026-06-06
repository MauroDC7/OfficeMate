import type { TimesheetGridDisplay } from '@/components/timesheets/timesheet-grid-display';

export const DRAG_CLICK_THRESHOLD_PX = 4;
export const SNAP_MINUTES = 15;
const MIN_DURATION = SNAP_MINUTES;

export type EntryRange = {
    dayKey: string;
    start: number;
    end: number;
};

export type EntryInteractionMode = 'move' | 'resize-start' | 'resize-end';

function snap(minutes: number): number {
    return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

function yToMinutes(
    clientY: number,
    dayKey: string,
    timelineHeightPx: number,
    display: TimesheetGridDisplay,
): number | null {
    const column = document.querySelector<HTMLElement>(
        `[data-timesheet-day="${dayKey}"]`,
    );

    if (column === null) {
        return null;
    }

    const yPx = clientY - column.getBoundingClientRect().top;
    const ratio = Math.max(0, Math.min(1, yPx / timelineHeightPx));

    return display.dayStartMin + ratio * display.minutesSpan;
}

export function dayKeyAtX(
    clientX: number,
    dayKeys: readonly string[],
    fallback: string,
): string {
    for (const key of dayKeys) {
        const el = document.querySelector<HTMLElement>(
            `[data-timesheet-day="${key}"]`,
        );

        if (el === null) {
            continue;
        }

        const { left, right } = el.getBoundingClientRect();

        if (clientX >= left && clientX <= right) {
            return key;
        }
    }

    return fallback;
}

export function rangeForMove(options: {
    clientX: number;
    clientY: number;
    grabOffsetY: number;
    durationMinutes: number;
    sourceDayKey: string;
    dayKeys: readonly string[];
    timelineHeightPx: number;
    display: TimesheetGridDisplay;
}): EntryRange | null {
    const dayKey = dayKeyAtX(
        options.clientX,
        options.dayKeys,
        options.sourceDayKey,
    );
    const column = document.querySelector<HTMLElement>(
        `[data-timesheet-day="${dayKey}"]`,
    );

    if (column === null) {
        return null;
    }

    const topPx =
        options.clientY -
        column.getBoundingClientRect().top -
        options.grabOffsetY;
    const ratio = Math.max(0, Math.min(1, topPx / options.timelineHeightPx));
    let start = snap(
        options.display.dayStartMin + ratio * options.display.minutesSpan,
    );
    let end = start + options.durationMinutes;

    if (end > options.display.dayEndMin) {
        end = options.display.dayEndMin;
        start = end - options.durationMinutes;
    }

    if (start < options.display.dayStartMin) {
        start = options.display.dayStartMin;
        end = start + options.durationMinutes;
    }

    if (end - start < MIN_DURATION) {
        return null;
    }

    return { dayKey, start, end };
}

export function rangeForResizeStart(options: {
    clientY: number;
    dayKey: string;
    endMinutes: number;
    timelineHeightPx: number;
    display: TimesheetGridDisplay;
}): EntryRange | null {
    const raw = yToMinutes(
        options.clientY,
        options.dayKey,
        options.timelineHeightPx,
        options.display,
    );

    if (raw === null) {
        return null;
    }

    let start = snap(raw);
    const end = options.endMinutes;

    start = Math.min(start, end - MIN_DURATION);
    start = Math.max(options.display.dayStartMin, start);

    if (end - start < MIN_DURATION) {
        return null;
    }

    return { dayKey: options.dayKey, start, end };
}

export function rangeForResizeEnd(options: {
    clientY: number;
    dayKey: string;
    startMinutes: number;
    timelineHeightPx: number;
    display: TimesheetGridDisplay;
}): EntryRange | null {
    const raw = yToMinutes(
        options.clientY,
        options.dayKey,
        options.timelineHeightPx,
        options.display,
    );

    if (raw === null) {
        return null;
    }

    const start = options.startMinutes;
    let end = snap(raw);

    end = Math.max(end, start + MIN_DURATION);
    end = Math.min(options.display.dayEndMin, end);

    if (end - start < MIN_DURATION) {
        return null;
    }

    return { dayKey: options.dayKey, start, end };
}

export function entryBlockPosition(
    startMinutes: number,
    endMinutes: number,
    timelineHeightPx: number,
    display: TimesheetGridDisplay,
): { top: number; height: number } {
    const top =
        ((startMinutes - display.dayStartMin) / display.minutesSpan) *
        timelineHeightPx;
    const height = Math.max(
        ((endMinutes - startMinutes) / display.minutesSpan) * timelineHeightPx,
        (MIN_DURATION / display.minutesSpan) * timelineHeightPx,
    );

    return { top, height };
}
