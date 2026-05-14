import { GRID_TEMPLATE } from '@/components/timesheets/timesheet-grid-config';
import { dayKey, formatDayTotal, isToday } from '@/components/timesheets/timesheet-helpers';
import { cn } from '@/lib/utils';

type TimesheetWeekHeaderProps = {
    weekRangeLabel: string;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    weekDays: Date[];
    minutesPerDay: Record<string, number>;
};

export function TimesheetWeekHeader({
    weekRangeLabel,
    onPrevWeek,
    onNextWeek,
    weekDays,
    minutesPerDay,
}: TimesheetWeekHeaderProps) {
    return (
        <>
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Timesheets</p>
                    <p className="mt-0.5 text-base font-semibold text-gray-900">{weekRangeLabel}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={onPrevWeek}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        Vorige week
                    </button>
                    <button
                        type="button"
                        onClick={onNextWeek}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        Volgende week
                    </button>
                </div>
            </div>

            <div className={cn('grid border-b border-gray-200 bg-white', GRID_TEMPLATE)}>
                <div className="border-e border-gray-100" aria-hidden />
                {weekDays.map((day) => {
                    const key = dayKey(day);
                    const today = isToday(day);
                    const total = minutesPerDay[key] ?? 0;
                    const longTitle = day.toLocaleDateString('nl-BE', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    });

                    return (
                        <div
                            key={key}
                            className={cn(
                                'border-s border-gray-200 px-2 py-3 text-center sm:px-3',
                                today && 'bg-violet-50/40',
                            )}
                            title={longTitle}
                        >
                            <div
                                className={cn(
                                    'mx-auto flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold tabular-nums sm:h-11 sm:w-11 sm:text-2xl',
                                    today ? 'bg-violet-100 text-violet-800 ring-2 ring-violet-300/80' : 'text-gray-900',
                                )}
                            >
                                {day.getDate()}
                            </div>
                            <p
                                className={cn(
                                    'mt-1 text-[0.65rem] font-semibold tracking-widest uppercase sm:text-xs',
                                    today ? 'text-violet-700' : 'text-gray-500',
                                )}
                            >
                                {day.toLocaleDateString('nl-BE', { weekday: 'short' })}
                            </p>
                            <p className="mt-1 text-xs tabular-nums text-gray-500">{formatDayTotal(total)}</p>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
