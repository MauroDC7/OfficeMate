import {
    dayKey,
    formatDayTotal,
    isSameMonth,
    isToday,
} from '@/components/timesheets/timesheet-helpers';
import { cn } from '@/lib/utils';

const WEEKDAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

type TimesheetMonthBodyProps = {
    monthYmd: string;
    gridDays: Date[];
    minutesPerDay: Record<string, number>;
    onDaySelect: (ymd: string) => void;
};

export function TimesheetMonthBody({
    monthYmd,
    gridDays,
    minutesPerDay,
    onDaySelect,
}: TimesheetMonthBodyProps) {
    return (
        <div className="border-t border-gray-100">
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80">
                {WEEKDAY_LABELS.map((label) => (
                    <div
                        key={label}
                        className="px-1 py-2 text-center text-[0.65rem] font-semibold tracking-wide text-gray-500 uppercase sm:text-xs"
                    >
                        {label}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {gridDays.map((day) => {
                    const key = dayKey(day);
                    const inMonth = isSameMonth(day, monthYmd);
                    const today = isToday(day);
                    const totalMinutes = minutesPerDay[key] ?? 0;
                    const longTitle = day.toLocaleDateString('nl-BE', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    });

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onDaySelect(key)}
                            disabled={!inMonth}
                            title={longTitle}
                            className={cn(
                                'min-h-[4.5rem] border-b border-e border-gray-100 px-1 py-2 text-left transition sm:min-h-[5.5rem] sm:px-2 sm:py-2.5',
                                !inMonth && 'cursor-default bg-gray-50/60 text-gray-300',
                                inMonth && 'hover:bg-gray-50',
                                inMonth && today && 'bg-violet-50/50',
                            )}
                        >
                            <span
                                className={cn(
                                    'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums sm:h-8 sm:w-8',
                                    inMonth && today
                                        ? 'bg-violet-100 text-violet-800 ring-2 ring-violet-300/80'
                                        : inMonth
                                          ? 'text-gray-900'
                                          : 'text-gray-300',
                                )}
                            >
                                {day.getDate()}
                            </span>
                            {inMonth && totalMinutes > 0 ? (
                                <p className="mt-1 truncate text-[0.65rem] font-medium text-gray-600 tabular-nums sm:text-xs">
                                    {formatDayTotal(totalMinutes)}
                                </p>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
