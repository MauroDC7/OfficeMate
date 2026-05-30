import { Head, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import {
    LEAVE_REQUEST_FILTERS,
    type LeaveRequestStatusFilter,
} from '@/components/leave-requests/leave-request-helpers';
import { LeaveRequestsList } from '@/components/leave-requests/leave-requests-list';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { LeaveRequestsPageProps } from '@/types/leave-requests';

function pendingDetail(count: number): string {
    if (count === 0) {
        return 'Geen aanvragen in behandeling';
    }

    return count === 1
        ? '1 aanvraag wacht op goedkeuring'
        : `${count} aanvragen wachten op goedkeuring`;
}

function openLeaveDetail(days: number): string {
    if (days === 0) {
        return 'Geen resterend goedgekeurd verlof';
    }

    return days === 1 ? 'Nog 1 verlofdag gepland' : `Nog ${days} verlofdagen gepland`;
}

function upcomingDetail(count: number): string {
    if (count === 0) {
        return 'Geen goedgekeurde periodes vooruit';
    }

    return count === 1
        ? '1 goedgekeurde periode'
        : `${count} goedgekeurde periodes`;
}

export default function LeaveRequests() {
    const { stats, requests } = usePage<LeaveRequestsPageProps>().props;
    const [statusFilter, setStatusFilter] = useState<LeaveRequestStatusFilter>('all');

    const filteredRequests = useMemo(
        () =>
            statusFilter === 'all'
                ? requests
                : requests.filter((request) => request.status === statusFilter),
        [requests, statusFilter],
    );

    const hasRequests = requests.length > 0;

    return (
        <AppLayout>
            <Head title="Verlofaanvragen" />
            <main className="mx-auto box-border w-full max-w-5xl min-w-0 px-4 py-4 sm:px-5 sm:py-5 md:max-w-6xl md:px-6 lg:max-w-7xl lg:px-8 lg:py-6 xl:max-w-none xl:px-8 2xl:px-12">
                <div className="min-w-0">
                    <h1 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
                        Verlofaanvragen
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Overzicht van je verlofperiodes, status en geplande afwezigheid.
                    </p>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:mt-6">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                            Open verlofdagen
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
                            {stats.openLeaveDays}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            {openLeaveDetail(stats.openLeaveDays)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                            In behandeling
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
                            {stats.pendingCount}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            {pendingDetail(stats.pendingCount)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                            Goedgekeurd
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
                            {stats.approvedUpcomingCount}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            {upcomingDetail(stats.approvedUpcomingCount)}
                        </p>
                    </div>
                </div>

                <section className="mt-5 rounded-xl border border-gray-200 bg-white shadow-sm sm:mt-6">
                    <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
                        <h2 className="text-sm font-semibold text-gray-900">Jouw aanvragen</h2>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Nieuwste periodes eerst. Filter op status.
                        </p>

                        {hasRequests ? (
                            <div
                                className="mt-3 flex flex-wrap gap-2"
                                role="tablist"
                                aria-label="Filter op status"
                            >
                                {LEAVE_REQUEST_FILTERS.map(({ value, label }) => {
                                    const active = statusFilter === value;

                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            onClick={() => setStatusFilter(value)}
                                            className={cn(
                                                'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                                                active
                                                    ? 'border-gray-900 bg-gray-900 text-white'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>

                    {!hasRequests ? (
                        <div className="px-4 py-12 text-center sm:px-5">
                            <p className="text-sm font-medium text-gray-900">
                                Nog geen verlofaanvragen
                            </p>
                            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                                Zodra je verlof aanvraagt, verschijnen je periodes en status hier.
                            </p>
                        </div>
                    ) : (
                        <LeaveRequestsList requests={filteredRequests} />
                    )}
                </section>
            </main>
        </AppLayout>
    );
}
