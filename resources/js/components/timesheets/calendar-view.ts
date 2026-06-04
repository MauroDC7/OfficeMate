export type CalendarView = 'day' | 'workweek' | 'week' | 'month';

export const CALENDAR_VIEWS: CalendarView[] = ['day', 'workweek', 'week', 'month'];

export function isCalendarView(value: string | null | undefined): value is CalendarView {
    return (
        value === 'day' ||
        value === 'workweek' ||
        value === 'week' ||
        value === 'month'
    );
}

export const CALENDAR_VIEW_LABELS: Record<CalendarView, string> = {
    day: '1 dag',
    workweek: '5 dagen',
    week: 'Week',
    month: 'Maand',
};

export function parseCalendarQueryFromUrl(pageUrl: string): {
    calendarView: CalendarView | null;
    focusDay: string | null;
    month: string | null;
} {
    const { searchParams } = new URL(pageUrl, 'http://localhost');
    const viewParam = searchParams.get('view');
    const monthParam = searchParams.get('month');

    return {
        calendarView: isCalendarView(viewParam) ? viewParam : null,
        focusDay: searchParams.get('day'),
        month:
            monthParam !== null && /^\d{4}-\d{2}$/.test(monthParam)
                ? monthParam
                : null,
    };
}
