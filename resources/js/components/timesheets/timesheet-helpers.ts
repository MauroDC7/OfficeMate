import type { CalendarView } from '@/components/timesheets/calendar-view';
import {
    DEFAULT_GRID_DISPLAY,
    type TimesheetGridDisplay,
} from '@/components/timesheets/timesheet-grid-display';
import {
    MINUTES_IN_DAY,
    WEEKDAY_INDICES,
    WORKDAY_INDICES,
} from '@/components/timesheets/timesheet-grid-config';
import type { TimesheetEntryPayload } from '@/types/timesheets';

export function startOfMonday(reference: Date): Date {
    const d = new Date(
        reference.getFullYear(),
        reference.getMonth(),
        reference.getDate(),
    );
    const weekday = d.getDay();
    const offset = weekday === 0 ? -6 : 1 - weekday;
    d.setDate(d.getDate() + offset);

    return d;
}

export function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);

    return next;
}

export function dayKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${day}`;
}

export function parseYmdLocal(ymd: string): Date {
    const [y, m, d] = ymd.split('-').map(Number);

    return new Date(y, m - 1, d);
}

export function addWeeksToYmd(ymd: string, deltaWeeks: number): string {
    const d = parseYmdLocal(ymd);
    d.setDate(d.getDate() + deltaWeeks * 7);

    return dayKey(d);
}

export function addDaysToYmd(ymd: string, days: number): string {
    return dayKey(addDays(parseYmdLocal(ymd), days));
}

export function mondayYmdForDate(date: Date): string {
    return dayKey(startOfMonday(date));
}

export function mondayYmdForYmd(ymd: string): string {
    return mondayYmdForDate(parseYmdLocal(ymd));
}

export function isYmdInWeek(ymd: string, weekStartYmd: string): boolean {
    const monday = parseYmdLocal(weekStartYmd);
    const target = parseYmdLocal(ymd).getTime();
    const weekStart = monday.getTime();
    const weekEnd = addDays(monday, 6).getTime();

    return target >= weekStart && target <= weekEnd;
}

export function resolveFocusDayYmd(
    weekStartYmd: string,
    focusDayYmd: string | null,
): string {
    if (focusDayYmd !== null && isYmdInWeek(focusDayYmd, weekStartYmd)) {
        return focusDayYmd;
    }

    const todayYmd = dayKey(new Date());

    if (isYmdInWeek(todayYmd, weekStartYmd)) {
        return todayYmd;
    }

    return weekStartYmd;
}

export function calendarDaysForView(
    weekStartYmd: string,
    view: CalendarView,
    focusDayYmd: string,
): Date[] {
    const monday = parseYmdLocal(weekStartYmd);

    if (view === 'day') {
        return [parseYmdLocal(focusDayYmd)];
    }

    const indices = view === 'workweek' ? WORKDAY_INDICES : WEEKDAY_INDICES;

    return indices.map((i) => addDays(monday, i));
}

export function isToday(date: Date): boolean {
    const a = new Date();

    return (
        a.getFullYear() === date.getFullYear() &&
        a.getMonth() === date.getMonth() &&
        a.getDate() === date.getDate()
    );
}

export function minutesToTimeLabel(total: number): string {
    const t = ((total % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
    const h = Math.floor(t / 60);
    const m = t % 60;

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function minutesToTimeInput(total: number): string {
    return minutesToTimeLabel(total);
}

export function formatMinutesRange(startMin: number, endMin: number): string {
    return `${minutesToTimeLabel(startMin)} – ${minutesToTimeLabel(endMin)}`;
}

export function parseTimeInputToMinutes(value: string): number | null {
    const parts = value.trim().split(':');

    if (parts.length < 2) {
        return null;
    }

    const h = Number(parts[0]);
    const m = Number(parts[1]);

    if (
        !Number.isFinite(h) ||
        !Number.isFinite(m) ||
        h < 0 ||
        h > 23 ||
        m < 0 ||
        m > 59
    ) {
        return null;
    }

    return h * 60 + m;
}

export function dayTotalMinutes(entries: TimesheetEntryPayload[]): number {
    return entries.reduce(
        (sum, e) => sum + Math.max(0, e.end_minutes - e.start_minutes),
        0,
    );
}

export function formatDayTotal(total: number): string {
    const h = Math.floor(total / 60);
    const m = total % 60;

    if (h === 0) {
        return `${m}m`;
    }

    if (m === 0) {
        return `${h}u`;
    }

    return `${h}u ${m}m`;
}

export function currentMinutesSinceMidnight(): number {
    const n = new Date();

    return n.getHours() * 60 + n.getMinutes() + n.getSeconds() / 60;
}

export function minutesToTimelineY(
    minutesSinceMidnight: number,
    timelineHeightPx: number,
    display: TimesheetGridDisplay = DEFAULT_GRID_DISPLAY,
): number {
    const rel = Math.max(0, minutesSinceMidnight - display.dayStartMin);

    return (rel / display.minutesSpan) * timelineHeightPx;
}

export function visibleEntrySegment(
    startMin: number,
    endMin: number,
    display: TimesheetGridDisplay = DEFAULT_GRID_DISPLAY,
): { visStart: number; visEnd: number } | null {
    const visStart = Math.max(startMin, display.dayStartMin);
    const visEnd = Math.min(endMin, display.dayEndMin);

    if (visEnd <= visStart) {
        return null;
    }

    return { visStart, visEnd };
}

export function flattenFormErrors(
    errors: Record<string, string | string[]>,
): Record<string, string> {
    const flat: Record<string, string> = {};

    for (const [key, val] of Object.entries(errors)) {
        const msg = Array.isArray(val) ? val[0] : val;

        if (msg !== undefined && msg !== '') {
            flat[key] = msg;
        }
    }

    return flat;
}

export function formatActivityDayLabel(ymd: string): string {
    return new Date(`${ymd}T12:00:00`).toLocaleDateString('nl-BE', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

export function formatShortRelativeNl(iso: string): string {
    if (iso === '') {
        return '';
    }

    const then = new Date(iso).getTime();
    const diffSec = Math.round((Date.now() - then) / 1000);

    if (diffSec < 60) {
        return 'zojuist';
    }

    const diffMin = Math.round(diffSec / 60);

    if (diffMin < 60) {
        return `${diffMin} min geleden`;
    }

    const diffHour = Math.round(diffMin / 60);

    if (diffHour < 24) {
        return `${diffHour} u geleden`;
    }

    const diffDay = Math.round(diffHour / 24);

    return `${diffDay} dag${diffDay === 1 ? '' : 'en'} geleden`;
}

export function entriesByDayAfterMove(
    entriesByDay: Record<string, TimesheetEntryPayload[]>,
    entry: TimesheetEntryPayload,
    targetDayKey: string,
    startMinutes: number,
    endMinutes: number,
): Record<string, TimesheetEntryPayload[]> {
    const next: Record<string, TimesheetEntryPayload[]> = {};

    for (const [day, list] of Object.entries(entriesByDay)) {
        const filtered = list.filter((item) => item.id !== entry.id);

        if (filtered.length > 0) {
            next[day] = filtered;
        }
    }

    const moved: TimesheetEntryPayload = {
        ...entry,
        worked_on: targetDayKey,
        start_minutes: startMinutes,
        end_minutes: endMinutes,
    };

    next[targetDayKey] = [...(next[targetDayKey] ?? []), moved].sort(
        (a, b) => a.start_minutes - b.start_minutes,
    );

    return next;
}

export function timesheetProjectLabel(entry: {
    project_name: string | null;
    client_name: string | null;
}): string | null {
    const projectName = entry.project_name?.trim();

    if (projectName !== undefined && projectName !== '') {
        return projectName;
    }

    const clientName = entry.client_name?.trim();

    if (clientName !== undefined && clientName !== '') {
        return clientName;
    }

    return null;
}
