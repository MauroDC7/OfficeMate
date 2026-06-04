import { useState } from 'react';

import {
    adjustDurationMinutes,
    applyDurationFromStart,
    durationMinutesFromTimeInputs,
    formatDayTotal,
    formatMinutesRange,
    parseTimeInputToMinutes,
} from '@/components/timesheets/timesheet-helpers';
import { cn } from '@/lib/utils';

const DURATION_PRESETS_MINUTES = [30, 60, 120, 240] as const;

type TimesheetDurationControlsProps = {
    start: string;
    end: string;
    disabled?: boolean;
    onChange: (start: string, end: string) => void;
    errorStart?: string;
    errorEnd?: string;
    className?: string;
};

function presetLabel(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`;
    }

    return `${minutes / 60}u`;
}

function IconChevron({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
        >
            <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function TimesheetDurationControls({
    start,
    end,
    disabled = false,
    onChange,
    errorStart,
    errorEnd,
    className,
}: TimesheetDurationControlsProps) {
    const [preciseOpen, setPreciseOpen] = useState(false);

    const startMin = parseTimeInputToMinutes(start);
    const endMin = parseTimeInputToMinutes(end);
    const durationMinutes = durationMinutesFromTimeInputs(start, end);
    const rangeValid =
        startMin !== null && endMin !== null && endMin > startMin;
    const rangeLabel = rangeValid
        ? formatMinutesRange(startMin, endMin)
        : '–';
    const durationLabel =
        durationMinutes !== null
            ? formatDayTotal(durationMinutes)
            : '–';

    const timeError = errorStart ?? errorEnd;

    function applyRange(next: { start: string; end: string } | null): void {
        if (next !== null) {
            onChange(next.start, next.end);
        }
    }

    function setPreset(minutes: number): void {
        applyRange(applyDurationFromStart(start, minutes));
    }

    function nudgeDuration(delta: number): void {
        applyRange(adjustDurationMinutes(start, end, delta));
    }

    const chipClass = (active: boolean) =>
        cn(
            'rounded-lg border px-2.5 py-1.5 text-xs font-medium tabular-nums transition',
            active
                ? 'border-violet-600 bg-violet-600 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-violet-300 hover:bg-violet-50',
            disabled && 'pointer-events-none opacity-50',
        );

    const stepperClass =
        'flex size-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition hover:border-violet-300 hover:bg-violet-50 disabled:pointer-events-none disabled:opacity-50';

    return (
        <div className={cn('space-y-2.5', className)}>
            <div className="flex items-end justify-between gap-3">
                <div>
                    <p className="text-[0.65rem] font-medium tracking-wide text-gray-500 uppercase">
                        Duur
                    </p>
                    <p className="text-xl font-semibold tracking-tight text-gray-900 tabular-nums">
                        {durationLabel}
                    </p>
                </div>
                <p className="text-end text-sm text-gray-600 tabular-nums">
                    {rangeLabel}
                </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {DURATION_PRESETS_MINUTES.map((minutes) => (
                    <button
                        key={minutes}
                        type="button"
                        disabled={disabled}
                        onClick={() => setPreset(minutes)}
                        className={chipClass(durationMinutes === minutes)}
                    >
                        {presetLabel(minutes)}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    aria-label="15 minuten korter"
                    disabled={disabled}
                    onClick={() => nudgeDuration(-15)}
                    className={stepperClass}
                >
                    −
                </button>
                <span className="flex-1 text-center text-xs text-gray-500">
                    Per kwartier
                </span>
                <button
                    type="button"
                    aria-label="15 minuten langer"
                    disabled={disabled}
                    onClick={() => nudgeDuration(15)}
                    className={stepperClass}
                >
                    +
                </button>
            </div>

            <button
                type="button"
                disabled={disabled}
                onClick={() => setPreciseOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-0.5 text-xs font-medium text-gray-500 transition hover:text-gray-700 disabled:opacity-50"
            >
                Exacte tijden
                <IconChevron
                    className={cn(
                        'shrink-0 transition',
                        preciseOpen && 'rotate-180',
                    )}
                />
            </button>

            {preciseOpen ? (
                <div className="flex items-center gap-2">
                    <input
                        type="time"
                        value={start}
                        disabled={disabled}
                        onChange={(event) =>
                            onChange(event.target.value, end)
                        }
                        aria-label="Starttijd"
                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 tabular-nums focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    />
                    <span className="shrink-0 text-gray-400">–</span>
                    <input
                        type="time"
                        value={end}
                        disabled={disabled}
                        onChange={(event) =>
                            onChange(start, event.target.value)
                        }
                        aria-label="Eindtijd"
                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 tabular-nums focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    />
                </div>
            ) : null}

            {timeError !== undefined ? (
                <p className="text-xs text-red-600">{timeError}</p>
            ) : null}
        </div>
    );
}
