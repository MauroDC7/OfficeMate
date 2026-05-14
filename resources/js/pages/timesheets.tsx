import { Head, usePage } from '@inertiajs/react';

import { TimesheetWeekCalendar } from '@/components/timesheets/timesheet-week-calendar';
import { AppLayout } from '@/layouts/app-layout';
import type { TimesheetEntryPayload } from '@/types/timesheets';

type TimesheetsPageProps = {
    weekStart: string;
    entriesByDay: Record<string, TimesheetEntryPayload[]>;
};

export default function Timesheets() {
    const { weekStart, entriesByDay } = usePage<TimesheetsPageProps>().props;

    return (
        <AppLayout>
            <Head title="Timesheets" />
            <main className="mx-auto box-border w-full min-w-0 max-w-5xl px-4 py-4 sm:px-5 sm:py-5 md:max-w-6xl md:px-6 lg:max-w-7xl lg:px-8 lg:py-6 xl:max-w-none xl:px-8 2xl:px-12">
                <h1 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl lg:text-2xl">Timesheets</h1>

                <div className="mt-5 w-full min-w-0 sm:mt-6 lg:mt-7">
                    <TimesheetWeekCalendar weekStart={weekStart} entriesByDay={entriesByDay} />
                </div>
            </main>
        </AppLayout>
    );
}
