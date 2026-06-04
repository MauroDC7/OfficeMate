import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef } from 'react';

import { TIMESHEET_LIST_PROPS } from '@/components/timesheets/timesheet-list-props';
import { TimesheetSuggestionsPanel } from '@/components/timesheets/timesheet-suggestions-panel';
import { TimesheetWeekCalendar } from '@/components/timesheets/timesheet-week-calendar';
import { AppLayout } from '@/layouts/app-layout';
import { usePrivateChannel } from '@/lib/use-private-channel';
import { timesheets } from '@/routes';
import type {
    TimesheetActivityItem,
    TimesheetEntryPayload,
    TimesheetProjectOption,
    TimesheetProposalPayload,
} from '@/types/timesheets';

type TimesheetsPageProps = {
    weekStart: string;
    entriesByDay: Record<string, TimesheetEntryPayload[]>;
    recentActivity: TimesheetActivityItem[];
    proposals: TimesheetProposalPayload[];
    projectOptions: TimesheetProjectOption[];
    openEntryId: number | null;
    auth: { user: { id: number } | null };
};

export default function Timesheets() {
    const page = usePage<TimesheetsPageProps>();
    const {
        weekStart,
        entriesByDay,
        recentActivity,
        proposals,
        projectOptions,
        openEntryId,
    } = page.props;
    const userId = page.props.auth.user?.id ?? null;

    const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onTimesheetChanged = useCallback(() => {
        if (reloadTimerRef.current !== null) {
            clearTimeout(reloadTimerRef.current);
        }

        reloadTimerRef.current = setTimeout(() => {
            reloadTimerRef.current = null;
            router.reload({ only: [...TIMESHEET_LIST_PROPS] });
        }, 250);
    }, []);

    useEffect(() => {
        return () => {
            if (reloadTimerRef.current !== null) {
                clearTimeout(reloadTimerRef.current);
            }
        };
    }, []);

    const onNavigateToEntryEdit = useCallback(
        (entryId: number, workedOnYmd: string) => {
            router.visit(
                timesheets.url({
                    query: { week: weekStart, entry: entryId },
                }),
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        const dayEntries = entriesByDay[workedOnYmd] ?? [];

                        if (dayEntries.some((e) => e.id === entryId)) {
                            return;
                        }

                        router.visit(
                            timesheets.url({
                                query: { week: workedOnYmd, entry: entryId },
                            }),
                            { preserveScroll: true },
                        );
                    },
                },
            );
        },
        [weekStart, entriesByDay],
    );

    const broadcasting = page.props.broadcasting ?? null;

    usePrivateChannel(
        broadcasting,
        userId !== null ? `user.${userId}` : null,
        'timesheet.changed',
        onTimesheetChanged,
    );

    return (
        <AppLayout>
            <Head title="Timesheets" />
            <main className="mx-auto box-border w-full max-w-5xl min-w-0 px-4 py-4 sm:px-5 sm:py-5 md:max-w-6xl md:px-6 lg:max-w-7xl lg:px-8 lg:py-6 xl:max-w-none xl:px-8 2xl:px-12">
                <h1 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
                    Timesheets
                </h1>

                <div className="mt-5 flex w-full min-w-0 flex-col gap-5 sm:mt-6 lg:mt-7">
                    <TimesheetSuggestionsPanel
                        proposals={proposals}
                        recentActivity={recentActivity}
                        projectOptions={projectOptions}
                        onNavigateToEntryEdit={onNavigateToEntryEdit}
                    />
                    <TimesheetWeekCalendar
                        key={weekStart}
                        weekStart={weekStart}
                        entriesByDay={entriesByDay}
                        openEntryId={openEntryId}
                    />
                </div>
            </main>
        </AppLayout>
    );
}
