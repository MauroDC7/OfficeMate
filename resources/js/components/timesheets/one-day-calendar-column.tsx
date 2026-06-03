import { SLOT_MINUTES } from '@/components/timesheets/timesheet-grid-config';
import type { TimesheetGridDisplay } from '@/components/timesheets/timesheet-grid-display';
import { TimesheetEntryBlock } from '@/components/timesheets/timesheet-entry-block';
import { entryBlockPosition } from '@/components/timesheets/timesheet-entry-range';
import type { EntryInteractionMode } from '@/components/timesheets/timesheet-entry-range';
import {
    dayKey,
    isToday,
    minutesToTimeLabel,
    minutesToTimelineY,
    visibleEntrySegment,
} from '@/components/timesheets/timesheet-helpers';
import type { TimesheetInteractionPreview } from '@/components/timesheets/use-timesheet-entry-interaction';
import { cn } from '@/lib/utils';
import type { TimesheetEntryPayload } from '@/types/timesheets';

type OneDayCalendarColumnProps = {
    day: Date;
    entries: TimesheetEntryPayload[];
    timelineHeightPx: number;
    slotIndices: number[];
    gridDisplay: TimesheetGridDisplay;
    showNowLine: boolean;
    nowTopPx: number;
    preview: TimesheetInteractionPreview | null;
    onSlotClick: (dayKey: string, startMin: number, endMin: number) => void;
    onEntryClick: (dayKey: string, entry: TimesheetEntryPayload) => void;
    onEntryPointerDown: (
        mode: EntryInteractionMode,
        dayKey: string,
        entry: TimesheetEntryPayload,
        event: React.PointerEvent<HTMLElement>,
    ) => void;
    isInteractingEntry: (entryId: number) => boolean;
};

export function OneDayCalendarColumn({
    day,
    entries,
    timelineHeightPx,
    slotIndices,
    gridDisplay,
    showNowLine,
    nowTopPx,
    preview,
    onSlotClick,
    onEntryClick,
    onEntryPointerDown,
    isInteractingEntry,
}: OneDayCalendarColumnProps) {
    const key = dayKey(day);
    const today = isToday(day);
    const showPreview = preview !== null && preview.dayKey === key;

    return (
        <div
            data-timesheet-day={key}
            className={cn(
                'relative min-w-0 border-s border-gray-200',
                today && 'bg-violet-50/15',
                showPreview && 'bg-violet-50/40',
            )}
            style={{ height: timelineHeightPx }}
        >
            {gridDisplay.hourIndices.map((h) => {
                const startMin = h * 60;
                const topHour = minutesToTimelineY(startMin, timelineHeightPx, gridDisplay);
                const halfMin = startMin + 30;
                const topHalf =
                    halfMin < gridDisplay.dayEndMin
                        ? minutesToTimelineY(halfMin, timelineHeightPx, gridDisplay)
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
                const startMin = gridDisplay.dayStartMin + i * SLOT_MINUTES;
                const endMin = startMin + SLOT_MINUTES;
                const top = minutesToTimelineY(startMin, timelineHeightPx, gridDisplay);
                const height =
                    (SLOT_MINUTES / gridDisplay.minutesSpan) * timelineHeightPx;

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
                if (isInteractingEntry(entry.id)) {
                    return null;
                }

                const seg = visibleEntrySegment(
                    entry.start_minutes,
                    entry.end_minutes,
                    gridDisplay,
                );

                if (seg === null) {
                    return null;
                }

                const top = minutesToTimelineY(seg.visStart, timelineHeightPx, gridDisplay);
                const height = Math.max(
                    ((seg.visEnd - seg.visStart) / gridDisplay.minutesSpan) *
                        timelineHeightPx,
                    20,
                );

                return (
                    <TimesheetEntryBlock
                        key={entry.id}
                        entry={entry}
                        startMinutes={entry.start_minutes}
                        endMinutes={entry.end_minutes}
                        top={top}
                        height={height}
                        onOpen={() => onEntryClick(key, entry)}
                        onPointerDown={(mode, event) =>
                            onEntryPointerDown(mode, key, entry, event)
                        }
                    />
                );
            })}

            {showPreview && preview !== null ? (
                <TimesheetEntryBlock
                    entry={preview.entry}
                    startMinutes={preview.startMinutes}
                    endMinutes={preview.endMinutes}
                    preview
                    {...entryBlockPosition(
                        preview.startMinutes,
                        preview.endMinutes,
                        timelineHeightPx,
                        gridDisplay,
                    )}
                />
            ) : null}

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
