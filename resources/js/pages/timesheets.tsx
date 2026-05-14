import { Head, router, usePage } from '@inertiajs/react';
import { useCallback } from 'react';

import { TimesheetActivitySuggestions } from '@/components/timesheets/timesheet-activity-suggestions';
import {
    dayKey,
    parseYmdLocal,
    startOfMonday,
} from '@/components/timesheets/timesheet-helpers';
import { TimesheetWeekCalendar } from '@/components/timesheets/timesheet-week-calendar';
import { AppLayout } from '@/layouts/app-layout';
import { timesheets } from '@/routes';
import type {
    TimesheetActivityItem,
    TimesheetEntryPayload,
} from '@/types/timesheets';

type TimesheetsPageProps = {
    weekStart: string;
    entriesByDay: Record<string, TimesheetEntryPayload[]>;
    recentActivity: TimesheetActivityItem[];
    openEntryId: number | null;
};

export default function Timesheets() {
    const { weekStart, entriesByDay, recentActivity, openEntryId } =
        usePage<TimesheetsPageProps>().props;

    const navigateToEntryEdit = useCallback(
        (entryId: number, workedOn: string) => {
            const weekKey = dayKey(startOfMonday(parseYmdLocal(workedOn)));
            router.get(
                timesheets.url({ query: { week: weekKey, entry: entryId } }),
                {},
                { preserveScroll: true },
            );
        },
        [],
    );

    return (
        <AppLayout>
            <Head title="Timesheets" />
            <main className="mx-auto box-border w-full max-w-5xl min-w-0 px-4 py-4 sm:px-5 sm:py-5 md:max-w-6xl md:px-6 lg:max-w-7xl lg:px-8 lg:py-6 xl:max-w-none xl:px-8 2xl:px-12">
                <h1 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
                    Timesheets
                </h1>

                <div className="mt-5 flex w-full min-w-0 flex-col gap-8 sm:mt-6 lg:mt-7">
                    <TimesheetActivitySuggestions
                        recentActivity={recentActivity}
                        onNavigateToEntryEdit={navigateToEntryEdit}
                    />
                    <TimesheetWeekCalendar
                        weekStart={weekStart}
                        entriesByDay={entriesByDay}
                        openEntryId={openEntryId}
                    />
                </div>
            </main>
        </AppLayout>
    );
}
