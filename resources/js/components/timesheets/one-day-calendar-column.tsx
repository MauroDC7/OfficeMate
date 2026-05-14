import {
    DISPLAY_DAY_END_MIN,
    DISPLAY_DAY_START_MIN,
    DISPLAY_HOUR_INDICES,
    DISPLAY_MINUTES_SPAN,
    SLOT_MINUTES,
} from '@/components/timesheets/timesheet-grid-config';
import {
    dayKey,
    formatMinutesRange,
    isToday,
    minutesToTimeLabel,
    minutesToTimelineY,
    visibleEntrySegment,
} from '@/components/timesheets/timesheet-helpers';
import { cn } from '@/lib/utils';
import type { TimesheetEntryPayload } from '@/types/timesheets';

type OneDayCalendarColumnProps = {
    day: Date;
    entries: TimesheetEntryPayload[];
    timelineHeightPx: number;
    slotIndices: number[];
    showNowLine: boolean;
    nowTopPx: number;
    onSlotClick: (dayKey: string, startMin: number, endMin: number) => void;
    onEntryClick: (dayKey: string, entry: TimesheetEntryPayload) => void;
};

export function OneDayCalendarColumn({
    day,
    entries,
    timelineHeightPx,
    slotIndices,
    showNowLine,
    nowTopPx,
    onSlotClick,
    onEntryClick,
}: OneDayCalendarColumnProps) {
    const key = dayKey(day);
    const today = isToday(day);

    return (
        <div
            className={cn(
                'relative min-w-0 border-s border-gray-200',
                today && 'bg-violet-50/15',
            )}
            style={{ height: timelineHeightPx }}
        >
            {DISPLAY_HOUR_INDICES.map((h) => {
                const startMin = h * 60;
                const topHour = minutesToTimelineY(startMin, timelineHeightPx);
                const halfMin = startMin + 30;
                const topHalf =
                    halfMin < DISPLAY_DAY_END_MIN
                        ? minutesToTimelineY(halfMin, timelineHeightPx)
                        : null;

                return (
                    <div key={h}>
                        <div
                            className="pointer-events-none absolute start-0 end-0 z-[1] border-t border-gray-200"
                            style={{ top: topHour }}
                        />
                        {topHalf !== null ? (
                            <div
                                className="pointer-events-none absolute start-0 end-0 z-[1] border-t border-gray-100"
                                style={{ top: topHalf }}
                            />
                        ) : null}
                    </div>
                );
            })}

            {slotIndices.map((i) => {
                const startMin = DISPLAY_DAY_START_MIN + i * SLOT_MINUTES;
                const endMin = startMin + SLOT_MINUTES;
                const top = minutesToTimelineY(startMin, timelineHeightPx);
                const height =
                    (SLOT_MINUTES / DISPLAY_MINUTES_SPAN) * timelineHeightPx;

                return (
                    <button
                        key={startMin}
                        type="button"
                        onClick={() => onSlotClick(key, startMin, endMin)}
                        title={`${minutesToTimeLabel(startMin)}–${minutesToTimeLabel(endMin)} — klik om toe te voegen`}
                        className={cn(
                            'absolute start-0 end-0 z-0 cursor-pointer text-start transition hover:bg-violet-100/50 focus-visible:z-[5] focus-visible:bg-violet-100/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-violet-500',
                            i % 2 === 0 ? 'bg-transparent' : 'bg-gray-50/40',
                        )}
                        style={{ top, height }}
                        aria-label={`${day.toLocaleDateString('nl-BE', { weekday: 'long' })} ${minutesToTimeLabel(startMin)} tot ${minutesToTimeLabel(endMin)}`}
                    />
                );
            })}

            {entries.map((entry) => {
                const seg = visibleEntrySegment(
                    entry.start_minutes,
                    entry.end_minutes,
                );

                if (seg === null) {
                    return null;
                }

                const top = minutesToTimelineY(seg.visStart, timelineHeightPx);
                const height = Math.max(
                    ((seg.visEnd - seg.visStart) / DISPLAY_MINUTES_SPAN) *
                        timelineHeightPx,
                    20,
                );

                return (
                    <div
                        key={entry.id}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEntryClick(key, entry);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                onEntryClick(key, entry);
                            }
                        }}
                        className="pointer-events-auto absolute start-1 end-1 z-10 flex cursor-pointer flex-col gap-0.5 overflow-hidden rounded-md border border-violet-200 bg-violet-100/95 px-1.5 py-1 shadow-sm ring-violet-400/40 transition outline-none hover:border-violet-300 hover:shadow-md focus-visible:ring-2 sm:start-1.5 sm:end-1.5 sm:px-2 sm:py-1.5"
                        style={{ top, height }}
                    >
                        <p className="shrink-0 truncate text-[0.65rem] leading-tight font-semibold text-violet-950 sm:text-xs">
                            {entry.title}
                        </p>
                        {entry.description !== null &&
                        entry.description.trim() !== '' ? (
                            <p className="line-clamp-2 min-h-0 shrink text-[0.58rem] leading-snug text-violet-900/90 sm:text-[0.62rem]">
                                {entry.description.trim()}
                            </p>
                        ) : null}
                        {entry.client_name !== null &&
                        entry.client_name !== '' ? (
                            <p className="shrink-0 truncate text-[0.6rem] text-violet-800 sm:text-[0.65rem]">
                                {entry.client_name}
                            </p>
                        ) : null}
                        <p className="mt-auto shrink-0 text-[0.6rem] text-violet-700 tabular-nums sm:text-[0.65rem]">
                            {formatMinutesRange(
                                entry.start_minutes,
                                entry.end_minutes,
                            )}
                        </p>
                    </div>
                );
            })}

            {showNowLine ? (
                <div
                    className="pointer-events-none absolute start-0 end-0 z-20"
                    style={{ top: nowTopPx }}
                    aria-hidden
                >
                    <div className="relative flex w-full -translate-y-1/2 items-center">
                        <div className="absolute start-0 z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-violet-500 text-[7px] font-bold text-white shadow-md ring-2 ring-white">
                            ▶
                        </div>
                        <div className="ms-2 h-[3px] w-full rounded-full bg-violet-500 opacity-95 shadow-sm ring-1 ring-violet-300/60" />
                    </div>
                </div>
            ) : null}
        </div>
    );
}
