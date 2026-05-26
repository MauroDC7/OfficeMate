import {
    DISPLAY_HOUR_OPTIONS,
    formatHourOptionLabel,
} from '@/components/timesheets/timesheet-grid-display';
import { cn } from '@/lib/utils';

type TimesheetDisplayHourSelectsProps = {
    startHour: string;
    endHour: string;
    onStartHourChange: (value: string) => void;
    onEndHourChange: (value: string) => void;
    className?: string;
};

const selectClassName =
    'h-8 min-w-0 rounded-md border border-gray-200 bg-white px-1.5 py-0 text-xs text-gray-800 shadow-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400';

export function TimesheetDisplayHourSelects({
    startHour,
    endHour,
    onStartHourChange,
    onEndHourChange,
    className,
}: TimesheetDisplayHourSelectsProps) {
    return (
        <div
            className={cn('flex shrink-0 items-center gap-1', className)}
            aria-label="Uren tonen vanaf en tot"
        >
            <span className="text-xs text-gray-500">Tonen vanaf</span>
            <select
                id="timesheet-display-start-hour"
                value={startHour}
                onChange={(event) => onStartHourChange(event.target.value)}
                className={selectClassName}
                title="Eerste uur"
                aria-label="Eerste uur"
            >
                <option value="">—</option>
                {DISPLAY_HOUR_OPTIONS.map((hour) => (
                    <option key={hour} value={String(hour)}>
                        {formatHourOptionLabel(hour)}
                    </option>
                ))}
            </select>
            <span className="text-xs text-gray-500">tot</span>
            <select
                id="timesheet-display-end-hour"
                value={endHour}
                onChange={(event) => onEndHourChange(event.target.value)}
                className={selectClassName}
                title="Laatste uur"
                aria-label="Laatste uur"
            >
                <option value="">—</option>
                {DISPLAY_HOUR_OPTIONS.map((hour) => (
                    <option key={hour} value={String(hour)}>
                        {formatHourOptionLabel(hour)}
                    </option>
                ))}
            </select>
        </div>
    );
}
