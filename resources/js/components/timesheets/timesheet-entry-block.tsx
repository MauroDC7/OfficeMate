import {
    formatMinutesRange,
    timesheetProjectLabel,
} from '@/components/timesheets/timesheet-helpers';
import type { EntryInteractionMode } from '@/components/timesheets/timesheet-entry-range';
import type { TimesheetGridDisplay } from '@/components/timesheets/timesheet-grid-display';
import { cn } from '@/lib/utils';
import type { TimesheetEntryPayload } from '@/types/timesheets';

type TimesheetEntryBlockProps = {
    entry: TimesheetEntryPayload;
    startMinutes: number;
    endMinutes: number;
    top: number;
    height: number;
    preview?: boolean;
    onOpen?: () => void;
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
            className={cn(
                'absolute inset-x-0 z-20 h-3 cursor-ns-resize border-violet-400 opacity-0 transition group-hover/entry:opacity-100',
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
    const projectLabel = timesheetProjectLabel(entry);
    const timeLabel = formatMinutesRange(startMinutes, endMinutes);

    return (
        <div
            data-timesheet-entry
            role={preview ? 'presentation' : 'button'}
            tabIndex={preview ? undefined : 0}
            aria-hidden={preview}
            onKeyDown={
                preview || onOpen === undefined
                    ? undefined
                    : (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onOpen();
                          }
                      }
            }
            className={cn(
                'absolute start-1 end-1 flex flex-col gap-0.5 overflow-hidden rounded-md px-1.5 py-1 sm:start-1.5 sm:end-1.5 sm:px-2 sm:py-1.5',
                preview
                    ? 'pointer-events-none z-40 border-2 border-dashed border-violet-500 bg-violet-200/90 shadow-lg ring-2 ring-violet-400/50'
                    : 'group/entry pointer-events-auto z-10 touch-none border border-violet-200 bg-violet-100/95 shadow-sm select-none hover:border-violet-300 hover:shadow-md focus-visible:ring-2',
            )}
            style={{ top, height }}
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
                <p className="shrink-0 truncate text-[0.65rem] leading-tight font-semibold text-violet-950 sm:text-xs">
                    {entry.title}
                </p>
                {!preview &&
                entry.description !== null &&
                entry.description.trim() !== '' ? (
                    <p className="line-clamp-2 min-h-0 shrink text-[0.58rem] leading-snug text-violet-900/90 sm:text-[0.62rem]">
                        {entry.description.trim()}
                    </p>
                ) : null}
                {projectLabel !== null ? (
                    <p className="shrink-0 truncate text-[0.6rem] text-violet-800 sm:text-[0.65rem]">
                        {projectLabel}
                    </p>
                ) : null}
                <p
                    className={cn(
                        'mt-auto shrink-0 text-[0.6rem] tabular-nums sm:text-[0.65rem]',
                        preview
                            ? 'font-medium text-violet-900'
                            : 'text-violet-700',
                    )}
                >
                    {timeLabel}
                </p>
            </div>
        </div>
    );
}
