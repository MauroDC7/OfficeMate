import {
    CALENDAR_VIEW_LABELS,
    CALENDAR_VIEWS,
    type CalendarView,
} from '@/components/timesheets/calendar-view';
import { gridTemplateColumnsForDayCount } from '@/components/timesheets/timesheet-grid-config';
import {
    dayKey,
    formatDayTotal,
    isToday,
} from '@/components/timesheets/timesheet-helpers';
import { TimesheetDisplayHourSelects } from '@/components/timesheets/timesheet-display-hour-selects';
import { TimesheetMonthPicker } from '@/components/timesheets/timesheet-month-picker';
import { cn } from '@/lib/utils';

const NAV_BUTTON_CLASS =
    'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50';

type TimesheetWeekHeaderProps = {
    rangeLabel: string;
    calendarView: CalendarView;
    focusDayYmd: string;
    monthYmd: string;
    onMonthChange: (monthYmd: string) => void;
    startHour: string;
    endHour: string;
    onStartHourChange: (value: string) => void;
    onEndHourChange: (value: string) => void;
    onPrev: () => void;
    onNext: () => void;
    onViewChange: (view: CalendarView) => void;
    onDaySelect: (ymd: string) => void;
    visibleDays: Date[];
    minutesPerDay: Record<string, number>;
};

type DayHeaderCellProps = {
    day: Date;
    totalMinutes: number;
    isSelected: boolean;
    onSelect: () => void;
};

function DayHeaderCell({
    day,
    totalMinutes,
    isSelected,
    onSelect,
}: DayHeaderCellProps) {
    const today = isToday(day);
    const longTitle = day.toLocaleDateString('nl-BE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                'border-s border-gray-200 px-2 py-3 text-center transition sm:px-3',
                today && 'bg-violet-50/40',
                isSelected &&
                    'bg-violet-50 ring-1 ring-inset ring-violet-300/70',
                !isSelected && 'hover:bg-gray-50',
            )}
            title={longTitle}
        >
            <div
                className={cn(
                    'mx-auto flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold tabular-nums sm:h-11 sm:w-11 sm:text-2xl',
                    today
                        ? 'bg-violet-100 text-violet-800 ring-2 ring-violet-300/80'
                        : 'text-gray-900',
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
            <p className="mt-1 text-xs text-gray-500 tabular-nums">
                {formatDayTotal(totalMinutes)}
            </p>
        </button>
    );
}

function CalendarViewToggle({
    calendarView,
    onViewChange,
}: {
    calendarView: CalendarView;
    onViewChange: (view: CalendarView) => void;
}) {
    return (
        <div
            role="group"
            aria-label="Kalenderweergave"
            className="hidden rounded-lg border border-gray-200 bg-gray-50 p-0.5 md:inline-flex"
        >
            {CALENDAR_VIEWS.map((view) => (
                <button
                    key={view}
                    type="button"
                    onClick={() => onViewChange(view)}
                    aria-pressed={calendarView === view}
                    className={cn(
                        'rounded-md px-2.5 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm',
                        calendarView === view
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900',
                    )}
                >
                    {CALENDAR_VIEW_LABELS[view]}
                </button>
            ))}
        </div>
    );
}

export function TimesheetWeekHeader({
    rangeLabel,
    calendarView,
    focusDayYmd,
    monthYmd,
    onMonthChange,
    startHour,
    endHour,
    onStartHourChange,
    onEndHourChange,
    onPrev,
    onNext,
    onViewChange,
    onDaySelect,
    visibleDays,
    minutesPerDay,
}: TimesheetWeekHeaderProps) {
    const prevLabel =
        calendarView === 'day'
            ? 'Vorige dag'
            : calendarView === 'month'
              ? 'Vorige maand'
              : 'Vorige week';
    const nextLabel =
        calendarView === 'day'
            ? 'Volgende dag'
            : calendarView === 'month'
              ? 'Volgende maand'
              : 'Volgende week';
    const gridStyle = {
        gridTemplateColumns: gridTemplateColumnsForDayCount(visibleDays.length),
    };

    return (
        <>
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                        Timesheets
                    </p>
                    <p className="mt-0.5 text-base font-semibold text-gray-900">
                        {rangeLabel}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {calendarView === 'month' ? (
                        <TimesheetMonthPicker
                            value={monthYmd}
                            onChange={onMonthChange}
                        />
                    ) : (
                        <TimesheetDisplayHourSelects
                            startHour={startHour}
                            endHour={endHour}
                            onStartHourChange={onStartHourChange}
                            onEndHourChange={onEndHourChange}
                        />
                    )}
                    <CalendarViewToggle
                        calendarView={calendarView}
                        onViewChange={onViewChange}
                    />
                    <button
                        type="button"
                        onClick={onPrev}
                        className={NAV_BUTTON_CLASS}
                    >
                        {prevLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        className={NAV_BUTTON_CLASS}
                    >
                        {nextLabel}
                    </button>
                </div>
            </div>

            {calendarView !== 'month' ? (
                <div
                    className="grid border-b border-gray-200 bg-white"
                    style={gridStyle}
                >
                    <div className="border-e border-gray-100" aria-hidden />
                    {visibleDays.map((day) => {
                        const key = dayKey(day);

                        return (
                            <DayHeaderCell
                                key={key}
                                day={day}
                                totalMinutes={minutesPerDay[key] ?? 0}
                                isSelected={
                                    calendarView === 'day' &&
                                    key === focusDayYmd
                                }
                                onSelect={() => onDaySelect(key)}
                            />
                        );
                    })}
                </div>
            ) : null}
        </>
    );
}
