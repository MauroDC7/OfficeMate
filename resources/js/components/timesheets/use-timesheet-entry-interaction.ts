import { useCallback, useEffect, useRef, useState } from 'react';

import {
    DRAG_CLICK_THRESHOLD_PX,
    type EntryInteractionMode,
    type EntryRange,
    rangeForMove,
    rangeForResizeEnd,
    rangeForResizeStart,
} from '@/components/timesheets/timesheet-entry-range';
import type { TimesheetGridDisplay } from '@/components/timesheets/timesheet-grid-display';
import type { TimesheetEntryPayload } from '@/types/timesheets';

export type { EntryInteractionMode };

export type TimesheetInteractionPreview = {
    entryId: number;
    entry: TimesheetEntryPayload;
    dayKey: string;
    startMinutes: number;
    endMinutes: number;
};

type ActiveInteraction = {
    mode: EntryInteractionMode;
    entry: TimesheetEntryPayload;
    sourceDayKey: string;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    grabOffsetY: number;
    durationMinutes: number;
};

type UseTimesheetEntryInteractionOptions = {
    dayKeys: readonly string[];
    timelineHeightPx: number;
    gridDisplay: TimesheetGridDisplay;
    onEntryClick: (dayKey: string, entry: TimesheetEntryPayload) => void;
    onEntryMove: (
        entry: TimesheetEntryPayload,
        dayKey: string,
        startMinutes: number,
        endMinutes: number,
    ) => void;
};

function computeRange(
    active: ActiveInteraction,
    clientX: number,
    clientY: number,
    dayKeys: readonly string[],
    timelineHeightPx: number,
    display: TimesheetGridDisplay,
): EntryRange | null {
    if (active.mode === 'move') {
        return rangeForMove({
            clientX,
            clientY,
            grabOffsetY: active.grabOffsetY,
            durationMinutes: active.durationMinutes,
            sourceDayKey: active.sourceDayKey,
            dayKeys,
            timelineHeightPx,
            display,
        });
    }

    if (active.mode === 'resize-start') {
        return rangeForResizeStart({
            clientY,
            dayKey: active.sourceDayKey,
            endMinutes: active.entry.end_minutes,
            timelineHeightPx,
            display,
        });
    }

    return rangeForResizeEnd({
        clientY,
        dayKey: active.sourceDayKey,
        startMinutes: active.entry.start_minutes,
        timelineHeightPx,
        display,
    });
}

export function useTimesheetEntryInteraction({
    dayKeys,
    timelineHeightPx,
    gridDisplay,
    onEntryClick,
    onEntryMove,
}: UseTimesheetEntryInteractionOptions) {
    const [preview, setPreview] = useState<TimesheetInteractionPreview | null>(
        null,
    );
    const activeRef = useRef<ActiveInteraction | null>(null);
    const didDragRef = useRef(false);

    const context = { dayKeys, timelineHeightPx, display: gridDisplay };

    const endInteraction = useCallback(() => {
        activeRef.current = null;
        didDragRef.current = false;
        setPreview(null);
        document.body.classList.remove('cursor-grabbing', 'select-none');
    }, []);

    const applyPointer = useCallback(
        (clientX: number, clientY: number) => {
            const active = activeRef.current;

            if (active === null) {
                return;
            }

            const range = computeRange(
                active,
                clientX,
                clientY,
                context.dayKeys,
                context.timelineHeightPx,
                context.display,
            );

            if (range === null) {
                return;
            }

            setPreview({
                entryId: active.entry.id,
                entry: active.entry,
                dayKey: range.dayKey,
                startMinutes: range.start,
                endMinutes: range.end,
            });
        },
        [context.dayKeys, context.timelineHeightPx, context.display],
    );

    const onWindowPointerMove = useCallback(
        (event: PointerEvent) => {
            const active = activeRef.current;

            if (active === null || active.pointerId !== event.pointerId) {
                return;
            }

            const dx = event.clientX - active.startClientX;
            const dy = event.clientY - active.startClientY;

            if (
                !didDragRef.current &&
                Math.hypot(dx, dy) < DRAG_CLICK_THRESHOLD_PX
            ) {
                return;
            }

            didDragRef.current = true;
            applyPointer(event.clientX, event.clientY);
        },
        [applyPointer],
    );

    const onWindowPointerUp = useCallback(
        (event: PointerEvent) => {
            const active = activeRef.current;

            if (active === null || active.pointerId !== event.pointerId) {
                return;
            }

            window.removeEventListener('pointermove', onWindowPointerMove);
            window.removeEventListener('pointerup', onWindowPointerUp);
            window.removeEventListener('pointercancel', onWindowPointerUp);

            if (!didDragRef.current) {
                endInteraction();
                onEntryClick(active.sourceDayKey, active.entry);

                return;
            }

            const range = computeRange(
                active,
                event.clientX,
                event.clientY,
                context.dayKeys,
                context.timelineHeightPx,
                context.display,
            );

            if (range !== null) {
                const unchanged =
                    range.dayKey === active.sourceDayKey &&
                    range.start === active.entry.start_minutes &&
                    range.end === active.entry.end_minutes;

                if (!unchanged) {
                    onEntryMove(
                        active.entry,
                        range.dayKey,
                        range.start,
                        range.end,
                    );
                }
            }

            endInteraction();
        },
        [
            onWindowPointerMove,
            endInteraction,
            onEntryClick,
            onEntryMove,
            context.dayKeys,
            context.timelineHeightPx,
            context.display,
        ],
    );

    useEffect(() => {
        return () => {
            window.removeEventListener('pointermove', onWindowPointerMove);
            window.removeEventListener('pointerup', onWindowPointerUp);
            window.removeEventListener('pointercancel', onWindowPointerUp);
            document.body.classList.remove('cursor-grabbing', 'select-none');
        };
    }, [onWindowPointerMove, onWindowPointerUp]);

    const onPointerDown = useCallback(
        (
            mode: EntryInteractionMode,
            dayKey: string,
            entry: TimesheetEntryPayload,
            event: React.PointerEvent<HTMLElement>,
        ) => {
            if (event.button !== 0) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const entryEl = event.currentTarget.closest('[data-timesheet-entry]');

            if (!(entryEl instanceof HTMLElement)) {
                return;
            }

            const rect = entryEl.getBoundingClientRect();

            activeRef.current = {
                mode,
                entry,
                sourceDayKey: dayKey,
                pointerId: event.pointerId,
                startClientX: event.clientX,
                startClientY: event.clientY,
                grabOffsetY: event.clientY - rect.top,
                durationMinutes: entry.end_minutes - entry.start_minutes,
            };
            didDragRef.current = mode !== 'move';

            setPreview({
                entryId: entry.id,
                entry,
                dayKey,
                startMinutes: entry.start_minutes,
                endMinutes: entry.end_minutes,
            });

            if (mode !== 'move') {
                applyPointer(event.clientX, event.clientY);
            }

            document.body.classList.add('cursor-grabbing', 'select-none');
            window.addEventListener('pointermove', onWindowPointerMove);
            window.addEventListener('pointerup', onWindowPointerUp);
            window.addEventListener('pointercancel', onWindowPointerUp);
        },
        [applyPointer, onWindowPointerMove, onWindowPointerUp],
    );

    const isInteractingEntry = useCallback(
        (entryId: number) =>
            preview !== null && preview.entryId === entryId,
        [preview],
    );

    return {
        preview,
        onPointerDown,
        isInteractingEntry,
    };
}
