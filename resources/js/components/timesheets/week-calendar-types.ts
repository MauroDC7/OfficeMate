import { DEFAULT_TIMESHEET_ENTRY_COLOR } from '@/components/timesheets/timesheet-entry-color';
import type { TimesheetEntryPayload } from '@/types/timesheets';

export type TimesheetPopoverAnchor = {
    top: number;
    left: number;
    right: number;
    bottom: number;
};

export function rectToPopoverAnchor(rect: DOMRectReadOnly): TimesheetPopoverAnchor {
    return {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
    };
}

export type TimesheetModalState =
    | {
          mode: 'create';
          dayKey: string;
          startMin: number;
          endMin: number;
          trackerWindowTitles: string[];
          anchor?: TimesheetPopoverAnchor;
      }
    | {
          mode: 'edit';
          dayKey: string;
          entry: TimesheetEntryPayload;
          anchor?: TimesheetPopoverAnchor;
      };

export type TimesheetWeekCalendarProps = {
    weekStart: string;
    entriesByDay: Record<string, TimesheetEntryPayload[]>;
    openEntryId?: number | null;
};

export type TimesheetDraft = {
    title: string;
    description: string;
    projectId: string;
    color: string;
    start: string;
    end: string;
};

export const emptyDraft = (): TimesheetDraft => ({
    title: '',
    description: '',
    projectId: '',
    color: DEFAULT_TIMESHEET_ENTRY_COLOR,
    start: '09:00',
    end: '09:30',
});
