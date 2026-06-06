import { useRef } from 'react';

import {
    normalizeTimesheetEntryColor,
    timesheetEntryColorStyles,
} from '@/components/timesheets/timesheet-entry-color';
import {
    formatMinutesRange,
    timesheetProjectLabel,
} from '@/components/timesheets/timesheet-helpers';
import type { EntryInteractionMode } from '@/components/timesheets/timesheet-entry-range';
import { cn } from '@/lib/utils';
import type { TimesheetEntryPayload } from '@/types/timesheets';

type TimesheetEntryBlockProps = {
    entry: TimesheetEntryPayload;
    startMinutes: number;
    endMinutes: number;
    top: number;
    height: number;
    preview?: boolean;
    onOpen?: (anchor: DOMRectReadOnly) => void;
    onPointerDown?: (
        mode: EntryInteractionMode,
        event: React.PointerEvent<HTMLElement>,
    ) => void;
};

function ResizeEdge({
    edge,
    onPointerDown,
}: {
    edge: 'start' | 'end';
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
}) {
    const isStart = edge === 'start';
    const label = isStart ? 'Starttijd aanpassen' : 'Eindtijd aanpassen';

    return (
        <button
            type="button"
            tabIndex={-1}
            aria-label={label}
            title={label}
            onPointerDown={(event) => {
                event.stopPropagation();
                onPointerDown(event);
            }}
            style={{ borderColor: 'currentColor' }}
            className={cn(
                'absolute inset-x-0 z-20 h-3 cursor-ns-resize opacity-0 transition group-hover/entry:opacity-100',
                isStart
                    ? 'top-0 border-t-2'
                    : 'bottom-0 border-b-2',
            )}
        />
    );
}

export function TimesheetEntryBlock({
    entry,
    startMinutes,
    endMinutes,
    top,
    height,
    preview = false,
    onOpen,
    onPointerDown,
}: TimesheetEntryBlockProps) {
    const blockRef = useRef<HTMLDivElement>(null);
    const projectLabel = timesheetProjectLabel(entry);
    const timeLabel = formatMinutesRange(startMinutes, endMinutes);
    const entryColor = normalizeTimesheetEntryColor(entry.color);
    const colorStyles = timesheetEntryColorStyles(entryColor);

    function openEditor(): void {
        if (onOpen === undefined) {
            return;
        }

        const rect = blockRef.current?.getBoundingClientRect();

        if (rect !== undefined) {
            onOpen(rect);
        }
    }

    return (
        <div
            ref={blockRef}
            data-timesheet-entry
            data-timesheet-entry-id={preview ? undefined : entry.id}
            role={preview ? 'presentation' : 'button'}
            tabIndex={preview ? undefined : 0}
            aria-hidden={preview}
            onKeyDown={
                preview || onOpen === undefined
                    ? undefined
                    : (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openEditor();
                          }
                      }
            }
            className={cn(
                'absolute start-1 end-1 flex flex-col gap-0.5 overflow-hidden rounded-md border px-1.5 py-1 sm:start-1.5 sm:end-1.5 sm:px-2 sm:py-1.5',
                preview
                    ? 'pointer-events-none z-40 border-2 border-dashed shadow-lg ring-2 ring-black/5'
                    : 'group/entry pointer-events-auto z-10 touch-none shadow-sm select-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-violet-400/60',
            )}
            style={{
                top,
                height,
                ...colorStyles,
            }}
        >
            {!preview && onPointerDown !== undefined ? (
                <>
                    <ResizeEdge
                        edge="start"
                        onPointerDown={(e) =>
                            onPointerDown('resize-start', e)
                        }
                    />
                    <ResizeEdge
                        edge="end"
                        onPointerDown={(e) => onPointerDown('resize-end', e)}
                    />
                </>
            ) : null}

            <div
                className={cn(
                    'flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden',
                    !preview &&
                        onPointerDown !== undefined &&
                        'cursor-grab active:cursor-grabbing',
                )}
                onPointerDown={
                    preview || onPointerDown === undefined
                        ? undefined
                        : (e) => onPointerDown('move', e)
                }
            >
                <p className="shrink-0 truncate text-[0.65rem] leading-tight font-semibold sm:text-xs">
                    {entry.title}
                </p>
                {!preview &&
                entry.description !== null &&
                entry.description.trim() !== '' ? (
                    <p className="line-clamp-2 min-h-0 shrink text-[0.58rem] leading-snug opacity-90 sm:text-[0.62rem]">
                        {entry.description.trim()}
                    </p>
                ) : null}
                {projectLabel !== null ? (
                    <p className="shrink-0 truncate text-[0.6rem] opacity-85 sm:text-[0.65rem]">
                        {projectLabel}
                    </p>
                ) : null}
                <p
                    className={cn(
                        'mt-auto shrink-0 text-[0.6rem] tabular-nums opacity-80 sm:text-[0.65rem]',
                        preview && 'font-medium',
                    )}
                >
                    {timeLabel}
                </p>
            </div>
        </div>
    );
}
