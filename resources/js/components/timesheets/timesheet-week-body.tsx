import { useReducer, useEffect } from 'react';

import { OneDayCalendarColumn } from '@/components/timesheets/one-day-calendar-column';
import {
    DISPLAY_DAY_END_MIN,
    DISPLAY_DAY_START_MIN,
    DISPLAY_HOUR_INDICES,
    DISPLAY_SLOT_COUNT,
    GRID_TEMPLATE,
    SLOT_HEIGHT_OPTIONS,
} from '@/components/timesheets/timesheet-grid-config';
import {
    currentMinutesSinceMidnight,
    dayKey,
    isToday,
    minutesToTimeLabel,
    minutesToTimelineY,
} from '@/components/timesheets/timesheet-helpers';
import { cn } from '@/lib/utils';
import type { TimesheetEntryPayload } from '@/types/timesheets';

type TimesheetWeekBodyProps = {
    weekDays: Date[];
    entriesByDay: Record<string, TimesheetEntryPayload[]>;
    weekHasToday: boolean;
    slotHeightIndex: number;
    onSlotClick: (dayKey: string, startMin: number, endMin: number) => void;
    onEntryClick: (dayKey: string, entry: TimesheetEntryPayload) => void;
};

function HourLabelsColumn({ timelineHeightPx }: { timelineHeightPx: number }) {
    return (
        <div className="relative shrink-0 border-e border-gray-200 bg-gray-50/80">
            {DISPLAY_HOUR_INDICES.map((h) => {
                const startMin = h * 60;
                const top = minutesToTimelineY(startMin, timelineHeightPx);

                return (
                    <span
                        key={h}
                        className={cn(
                            'absolute end-1 start-0 text-end text-[0.65rem] tabular-nums text-gray-500 sm:text-xs',
                            h === 7 ? 'translate-y-0.5' : '-translate-y-1/2',
                        )}
                        style={{ top }}
                    >
                        {minutesToTimeLabel(startMin)}
                    </span>
                );
            })}
        </div>
    );
}

export function TimesheetWeekBody({
    weekDays,
    entriesByDay,
    weekHasToday,
    slotHeightIndex,
    onSlotClick,
    onEntryClick,
}: TimesheetWeekBodyProps) {
    const [, refreshNow] = useReducer((n: number) => n + 1, 0);

    useEffect(() => {
        const id = window.setInterval(() => refreshNow(), 30_000);

        return () => window.clearInterval(id);
    }, []);

    const slotHeightPx = SLOT_HEIGHT_OPTIONS[slotHeightIndex];
    const timelineHeightPx = DISPLAY_SLOT_COUNT * slotHeightPx;
    const slotIndices = Array.from({ length: DISPLAY_SLOT_COUNT }, (_, i) => i);

    const nowMin = currentMinutesSinceMidnight();
    const nowWithinDisplay = nowMin >= DISPLAY_DAY_START_MIN && nowMin < DISPLAY_DAY_END_MIN;
    const nowTopPx = minutesToTimelineY(nowMin, timelineHeightPx);

    return (
        <div className="max-h-[min(72vh,56rem)] overflow-y-auto overscroll-contain rounded-b-xl">
            <div className={cn('grid bg-white', GRID_TEMPLATE)} style={{ minHeight: timelineHeightPx }}>
                <HourLabelsColumn timelineHeightPx={timelineHeightPx} />
                {weekDays.map((day) => {
                    const key = dayKey(day);
                    const today = isToday(day);
                    const entries = entriesByDay[key] ?? [];
                    const showNowLine = weekHasToday && today && nowWithinDisplay;

                    return (
                        <OneDayCalendarColumn
                            key={key}
                            day={day}
                            entries={entries}
                            timelineHeightPx={timelineHeightPx}
                            slotIndices={slotIndices}
                            showNowLine={showNowLine}
                            nowTopPx={nowTopPx}
                            onSlotClick={onSlotClick}
                            onEntryClick={onEntryClick}
                        />
                    );
                })}
            </div>
        </div>
    );
}
