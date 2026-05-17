import type { TimesheetEntryPayload } from '@/types/timesheets';

export type TimesheetModalState =
    | { mode: 'create'; dayKey: string; startMin: number; endMin: number }
    | { mode: 'edit'; dayKey: string; entry: TimesheetEntryPayload };

export type TimesheetWeekCalendarProps = {
    weekStart: string;
    entriesByDay: Record<string, TimesheetEntryPayload[]>;
    openEntryId?: number | null;
};

export type TimesheetDraft = {
    title: string;
    description: string;
    client: string;
    start: string;
    end: string;
};

export const emptyDraft = (): TimesheetDraft => ({
    title: '',
    description: '',
    client: '',
    start: '09:00',
    end: '09:30',
});
