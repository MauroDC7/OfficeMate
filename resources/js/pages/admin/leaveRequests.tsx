import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState, type ReactNode } from 'react';

import { useAlert } from '@/components/alert';
import { AdminLeaveRequestsList } from '@/components/leave-requests/admin-leave-requests-list';
import {
    formatLeavePeriod,
    LEAVE_FILTER_TAB_ACTIVE_CLASS,
    LEAVE_FILTER_TAB_INACTIVE_CLASS,
    LEAVE_REQUEST_STATUS_LABELS,
} from '@/components/leave-requests/leave-request-helpers';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { leaveRequests as adminLeaveRequests } from '@/routes/admin';
import { approve, reject, revertApproval, revertRejection } from '@/routes/leaveRequests';
import type {
    AdminLeaveRequestListItem,
    AdminLeaveRequestStatusFilter,
    AdminLeaveRequestsPageProps,
} from '@/types/admin-leave-requests';

const STATUS_FILTERS: { value: AdminLeaveRequestStatusFilter; label: string }[] = [
    { value: 'pending', label: LEAVE_REQUEST_STATUS_LABELS.pending },
    { value: 'approved', label: LEAVE_REQUEST_STATUS_LABELS.approved },
    { value: 'rejected', label: LEAVE_REQUEST_STATUS_LABELS.rejected },
    { value: 'all', label: 'Alle' },
];

function IconClock() {
    return (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.8} />
            <path
                d="M12 7.5V12l3 2"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconCheck() {
    return (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M5 12.5 10 17l9-10"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconCross() {
    return (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M7 7l10 10M17 7 7 17"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
            />
        </svg>
    );
}

type StatCardProps = {
    label: string;
    value: number;
    detail: string;
    tone: string;
    icon: ReactNode;
};

function StatCard({ label, value, detail, tone, icon }: StatCardProps) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
                <span
                    className={cn(
                        'inline-flex size-8 shrink-0 items-center justify-center rounded-full',
                        tone,
                    )}
                >
                    {icon}
                </span>
            </div>
            <span className="mt-2 block text-3xl font-semibold tracking-tight text-gray-900">
                {value}
            </span>
            <p className="mt-1 text-xs text-gray-500">{detail}</p>
        </div>
    );
}

function countDetail(count: number, singular: string, plural: string): string {
    if (count === 0) {
        return `Geen ${plural}`;
    }

    return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

export default function AdminLeaveRequests() {
    const { organizationName, filters, counts, requests } =
        usePage<AdminLeaveRequestsPageProps>().props;
    const { success, confirm } = useAlert();
    const [search, setSearch] = useState(filters.search);

    useEffect(() => {
        setSearch(filters.search);
    }, [filters.search]);

    function visit(next: Partial<AdminLeaveRequestsPageProps['filters']>) {
        router.get(
            adminLeaveRequests.url({
                query: {
                    status: next.status ?? filters.status,
                    search: next.search ?? filters.search,
                },
            }),
            {},
            { preserveScroll: true },
        );
    }

    function submitSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        visit({ search: search.trim() });
    }

    function approveRequest(request: AdminLeaveRequestListItem) {
        router.post(
            approve.url({ leave_request: request.id }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => success(`Verlof van ${request.user.name} goedgekeurd.`),
            },
        );
    }

    async function rejectRequest(request: AdminLeaveRequestListItem) {
        const accepted = await confirm({
            message: `Aanvraag van ${request.user.name} afwijzen?`,
            confirmLabel: 'Afwijzen',
            variant: 'danger',
        });

        if (!accepted) {
            return;
        }

        router.post(
            reject.url({ leave_request: request.id }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => success(`Verlof van ${request.user.name} afgewezen.`),
            },
        );
    }

    async function revertApprovalRequest(request: AdminLeaveRequestListItem) {
        const period = formatLeavePeriod(request);

        const accepted = await confirm({
            message: `De goedgekeurde verlofaanvraag van ${request.user.name}${period !== '' ? ` (${period})` : ''} annuleren?`,
            confirmLabel: 'Annuleren',
            cancelLabel: 'Terug',
            variant: 'danger',
        });

        if (!accepted) {
            return;
        }

        router.post(
            revertApproval.url({ leave_request: request.id }),
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    success(
                        `Goedkeuring geannuleerd. De aanvraag van ${request.user.name} staat weer in behandeling.`,
                    ),
            },
        );
    }

    async function revertRejectionRequest(request: AdminLeaveRequestListItem) {
        const period = formatLeavePeriod(request);

        const accepted = await confirm({
            message: `De afgewezen verlofaanvraag van ${request.user.name}${period !== '' ? ` (${period})` : ''} terugzetten?`,
            confirmLabel: 'Terugzetten',
            cancelLabel: 'Terug',
            variant: 'danger',
        });

        if (!accepted) {
            return;
        }

        router.post(
            revertRejection.url({ leave_request: request.id }),
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    success(
                        `Afwijzing ingetrokken. De aanvraag van ${request.user.name} staat weer in behandeling.`,
                    ),
            },
        );
    }

    const orgLabel = organizationName.trim();

    return (
        <AppLayout>
            <Head title="Verlofbeheer" />
            <main className="mx-auto box-border w-full max-w-5xl min-w-0 px-4 py-4 sm:px-5 sm:py-5 md:max-w-6xl md:px-6 lg:max-w-7xl lg:px-8 lg:py-6 xl:max-w-none xl:px-8 2xl:px-12">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
                            Verlofbeheer
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            {orgLabel !== ''
                                ? `Overzicht van verlofaanvragen binnen ${orgLabel}.`
                                : 'Overzicht van verlofaanvragen binnen je organisatie.'}
                        </p>
                    </div>

                    <form onSubmit={submitSearch} className="relative w-full lg:max-w-sm lg:shrink-0">
                        <label htmlFor="leave-admin-search" className="sr-only">
                            Zoek medewerker
                        </label>
                        <input
                            id="leave-admin-search"
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Zoek op naam of e-mail…"
                            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 ps-10 pe-4 text-sm shadow-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10"
                        />
                        <span
                            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
                            aria-hidden
                        >
                            ⌕
                        </span>
                    </form>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:mt-6">
                    <StatCard
                        label={LEAVE_REQUEST_STATUS_LABELS.pending}
                        value={counts.pending}
                        detail={countDetail(counts.pending, 'aanvraag wacht op actie', 'aanvragen wachten op actie')}
                        tone="bg-gray-50 text-amber-600"
                        icon={<IconClock />}
                    />
                    <StatCard
                        label={LEAVE_REQUEST_STATUS_LABELS.approved}
                        value={counts.approved}
                        detail={countDetail(counts.approved, 'goedgekeurde aanvraag', 'goedgekeurde aanvragen')}
                        tone="bg-gray-50 text-emerald-600"
                        icon={<IconCheck />}
                    />
                    <StatCard
                        label={LEAVE_REQUEST_STATUS_LABELS.rejected}
                        value={counts.rejected}
                        detail={countDetail(counts.rejected, 'afgewezen aanvraag', 'afgewezen aanvragen')}
                        tone="bg-gray-50 text-rose-500"
                        icon={<IconCross />}
                    />
                </div>

                <section className="mt-5 rounded-xl border border-gray-200 bg-white shadow-sm sm:mt-6">
                    <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">Aanvragen</h2>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Nieuwste periodes eerst. Filter op status.
                            </p>
                        </div>

                        <div
                            className="flex flex-wrap gap-2"
                            role="tablist"
                            aria-label="Filter op status"
                        >
                            {STATUS_FILTERS.map(({ value, label }) => {
                                const active = filters.status === value;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => visit({ status: value })}
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
                    </div>

                    {requests.length === 0 ? (
                        <div className="px-4 py-12 text-center sm:px-5">
                            <p className="text-sm font-medium text-gray-900">Geen verlofaanvragen</p>
                            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                                Pas je filter of zoekterm aan, of wacht op nieuwe aanvragen van
                                medewerkers.
                            </p>
                        </div>
                    ) : (
                        <AdminLeaveRequestsList
                            requests={requests}
                            onApprove={approveRequest}
                            onReject={rejectRequest}
                            onRevertApproval={revertApprovalRequest}
                            onRevertRejection={revertRejectionRequest}
                        />
                    )}
                </section>
            </main>
        </AppLayout>
    );
}
