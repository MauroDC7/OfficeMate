import { Head, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { useAlert } from '@/components/alert';
import { LeaveRequestFormPanel } from '@/components/leave-requests/leave-request-form-panel';
import {
    formatLeavePeriodShort,
    LEAVE_FILTER_TAB_ACTIVE_CLASS,
    LEAVE_FILTER_TAB_INACTIVE_CLASS,
    LEAVE_REQUEST_FILTERS,
    type LeaveRequestStatusFilter,
} from '@/components/leave-requests/leave-request-helpers';
import { LeaveRequestsList } from '@/components/leave-requests/leave-requests-list';
import { LeaveSummaryCards } from '@/components/leave-requests/leave-summary-cards';
import { TeamLeaveOverview } from '@/components/leave-requests/team-leave-overview';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { LeaveRequestListItem, LeaveRequestsPageProps } from '@/types/leave-requests';

function IconPlus({ className }: { className?: string }) {
    return (
        <svg className={className} width={18} height={18} viewBox="0 0 24 24" aria-hidden fill="none">
            <path stroke="currentColor" strokeWidth={2} strokeLinecap="round" d="M12 5v14M5 12h14" />
        </svg>
    );
}

function daysUntil(date: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${date}T00:00:00`);

    return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export default function LeaveRequests() {
    const { success } = useAlert();
    const { balance, teamLeaveUpcoming, hasOrganization, stats, requests } =
        usePage<LeaveRequestsPageProps>().props;
    const [statusFilter, setStatusFilter] = useState<LeaveRequestStatusFilter>('all');
    const [creatingNew, setCreatingNew] = useState(false);
    const [editingRequest, setEditingRequest] = useState<LeaveRequestListItem | null>(null);
    const showForm = creatingNew || editingRequest !== null;

    function closeForm() {
        setCreatingNew(false);
        setEditingRequest(null);
    }

    function openCreate() {
        setEditingRequest(null);
        setCreatingNew(true);
    }

    function openEdit(request: LeaveRequestListItem) {
        setCreatingNew(false);
        setEditingRequest(request);
    }

    const lastPendingPeriod = useMemo(() => {
        const pending = requests.find((request) => request.status === 'pending');

        return pending !== undefined ? formatLeavePeriodShort(pending) : null;
    }, [requests]);

    const nextUpcomingInDays = useMemo(() => {
        const upcoming = requests
            .filter((request) => request.status === 'approved' && daysUntil(request.starts_on) >= 0)
            .sort((a, b) => a.starts_on.localeCompare(b.starts_on))[0];

        return upcoming !== undefined ? daysUntil(upcoming.starts_on) : null;
    }, [requests]);

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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
                            Verlofaanvragen
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Overzicht van je verlofperiodes, status en geplande afwezigheid.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                    >
                        <IconPlus />
                        Verlof aanvragen
                    </button>
                </div>

                <div className="mt-5 sm:mt-6">
                    <LeaveSummaryCards
                        balance={balance}
                        pendingCount={stats.pendingCount}
                        lastPendingPeriod={lastPendingPeriod}
                        upcomingCount={stats.approvedUpcomingCount}
                        nextUpcomingInDays={nextUpcomingInDays}
                    />
                </div>

                <section className="mt-5 rounded-xl border border-gray-200 bg-white shadow-sm sm:mt-6">
                    <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">Recente aanvragen</h2>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Nieuwste periodes eerst.
                            </p>
                        </div>

                        {hasRequests ? (
                            <div
                                className="flex flex-wrap gap-2"
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
                                                    ? LEAVE_FILTER_TAB_ACTIVE_CLASS
                                                    : LEAVE_FILTER_TAB_INACTIVE_CLASS,
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
                            <button
                                type="button"
                                onClick={openCreate}
                                className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                            >
                                <IconPlus />
                                Verlof aanvragen
                            </button>
                        </div>
                    ) : (
                        <LeaveRequestsList
                            requests={filteredRequests}
                            onEdit={openEdit}
                            onCancelled={() => success('Verlofaanvraag ingetrokken.')}
                        />
                    )}
                </section>

                <div className="mt-5 sm:mt-6">
                    <TeamLeaveOverview
                        title="Wie is er weg?"
                        description="Goedgekeurd verlof van collega’s in de komende vier weken."
                        items={teamLeaveUpcoming}
                        hasOrganization={hasOrganization}
                        emptyMessage="Geen collega’s met goedgekeurd verlof in deze periode."
                    />
                </div>

                {showForm ? (
                    <LeaveRequestFormPanel
                        request={editingRequest}
                        onClose={closeForm}
                        onSuccess={(message) => success(message)}
                    />
                ) : null}
            </main>
        </AppLayout>
    );
}
