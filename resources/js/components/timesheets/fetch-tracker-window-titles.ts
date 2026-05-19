import { trackerWindowTitles as trackerWindowTitlesRoute } from '@/routes/timesheets';

export async function fetchTrackerWindowTitles(
    workedOn: string,
    startMinutes: number,
    endMinutes: number,
): Promise<string[]> {
    const url = trackerWindowTitlesRoute.url({
        query: {
            worked_on: workedOn,
            start_minutes: startMinutes,
            end_minutes: endMinutes,
        },
    });

    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
    });

    if (! response.ok) {
        return [];
    }

    const data = (await response.json()) as { titles?: string[] };

    return Array.isArray(data.titles) ? data.titles : [];
}
