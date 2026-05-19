import { useEffect, useMemo, useState } from 'react';

import { OneDayCalendarColumn } from '@/components/timesheets/one-day-calendar-column';
import {
    DISPLAY_DAY_END_MIN,
    DISPLAY_DAY_START_MIN,
    DISPLAY_HOUR_INDICES,
    DISPLAY_SLOT_COUNT,
    gridTemplateColumnsForDayCount,
    SLOT_HEIGHT_PX,
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

const NOW_LINE_REFRESH_MS = 30_000;

type TimesheetWeekBodyProps = {
    visibleDays: Date[];
    entriesByDay: Record<string, TimesheetEntryPayload[]>;
    onSlotClick: (dayKey: string, startMin: number, endMin: number) => void;
    onEntryClick: (dayKey: string, entry: TimesheetEntryPayload) => void;
};

function HourLabelsColumn({ timelineHeightPx }: { timelineHeightPx: number }) {
    return (
        <div className="relative shrink-0 border-e border-gray-200 bg-gray-50/80">
            {DISPLAY_HOUR_INDICES.map((hour) => {
                const startMin = hour * 60;
                const top = minutesToTimelineY(startMin, timelineHeightPx);
                const isFirstHour = hour === DISPLAY_HOUR_INDICES[0];

                return (
                    <span
                        key={hour}
                        className={cn(
                            'absolute start-0 end-1 text-end text-[0.65rem] text-gray-500 tabular-nums sm:text-xs',
                            isFirstHour
                                ? 'translate-y-0.5'
                                : '-translate-y-1/2',
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

function useNowMinutes(): number {
    const [nowMinutes, setNowMinutes] = useState(currentMinutesSinceMidnight);

    useEffect(() => {
        const id = window.setInterval(() => {
            setNowMinutes(currentMinutesSinceMidnight());
        }, NOW_LINE_REFRESH_MS);

        return () => window.clearInterval(id);
    }, []);

    return nowMinutes;
}

export function TimesheetWeekBody({
    visibleDays,
    entriesByDay,
    onSlotClick,
    onEntryClick,
}: TimesheetWeekBodyProps) {
    const timelineHeightPx = DISPLAY_SLOT_COUNT * SLOT_HEIGHT_PX;
    const gridStyle = {
        gridTemplateColumns: gridTemplateColumnsForDayCount(visibleDays.length),
    };

    const slotIndices = useMemo(
        () => Array.from({ length: DISPLAY_SLOT_COUNT }, (_, i) => i),
        [],
    );

    const nowMinutes = useNowMinutes();
    const nowWithinDisplay =
        nowMinutes >= DISPLAY_DAY_START_MIN && nowMinutes < DISPLAY_DAY_END_MIN;
    const nowTopPx = minutesToTimelineY(nowMinutes, timelineHeightPx);

    return (
        <div className="max-h-[min(72vh,56rem)] overflow-y-auto overscroll-contain rounded-b-xl">
            <div
                className="grid bg-white"
                style={{ ...gridStyle, minHeight: timelineHeightPx }}
            >
                <HourLabelsColumn timelineHeightPx={timelineHeightPx} />
                {visibleDays.map((day) => {
                    const key = dayKey(day);
                    const showNowLine = nowWithinDisplay && isToday(day);

                    return (
                        <OneDayCalendarColumn
                            key={key}
                            day={day}
                            entries={entriesByDay[key] ?? []}
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
