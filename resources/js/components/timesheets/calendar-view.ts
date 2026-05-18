export type CalendarView = 'day' | 'workweek' | 'week';

export const CALENDAR_VIEWS: CalendarView[] = ['day', 'workweek', 'week'];

export function isCalendarView(value: string | null | undefined): value is CalendarView {
    return value === 'day' || value === 'workweek' || value === 'week';
}

export const CALENDAR_VIEW_LABELS: Record<CalendarView, string> = {
    day: '1 dag',
    workweek: '5 dagen',
    week: 'Week',
};

export function parseCalendarQueryFromUrl(pageUrl: string): {
    calendarView: CalendarView;
    focusDay: string | null;
} {
    const { searchParams } = new URL(pageUrl, 'http://localhost');
    const viewParam = searchParams.get('view');

    return {
        calendarView: isCalendarView(viewParam) ? viewParam : 'workweek',
        focusDay: searchParams.get('day'),
    };
}
