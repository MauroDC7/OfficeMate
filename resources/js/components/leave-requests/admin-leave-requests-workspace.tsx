import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import { useAlert } from '@/components/alert';
import {
    formatDayCount,
    formatLeavePeriod,
    LEAVE_REQUEST_STATUS_LABELS,
    LEAVE_REQUEST_STATUS_STYLES,
} from '@/components/leave-requests/leave-request-helpers';
import { cn } from '@/lib/utils';
import { leaveRequests as adminLeaveRequests } from '@/routes/admin';
import { approve, bulkApprove, reject } from '@/routes/leaveRequests';
import type {
    AdminLeaveRequestListItem,
    AdminLeaveRequestStatusFilter,
    AdminLeaveRequestsPageProps,
} from '@/types/admin-leave-requests';

const STATUS_TABS: { value: AdminLeaveRequestStatusFilter; label: string }[] = [
    { value: 'pending', label: 'Open' },
    { value: 'approved', label: LEAVE_REQUEST_STATUS_LABELS.approved },
    { value: 'rejected', label: LEAVE_REQUEST_STATUS_LABELS.rejected },
    { value: 'all', label: 'Alle' },
];

type AdminLeaveRequestsWorkspaceProps = Pick<
    AdminLeaveRequestsPageProps,
    'filters' | 'counts' | 'requests'
> & {
    onSuccess: (message: string) => void;
};

export function AdminLeaveRequestsWorkspace({
    filters,
    counts,
    requests,
    onSuccess,
}: AdminLeaveRequestsWorkspaceProps) {
    const { confirm } = useAlert();
    const [searchInput, setSearchInput] = useState(filters.search);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [rejectionReason, setRejectionReason] = useState('');

    const pendingRequests = useMemo(
        () => requests.filter((request) => request.can_approve),
        [requests],
    );

    const selectedRequest = useMemo(
        () => requests.find((request) => request.id === selectedId) ?? null,
        [requests, selectedId],
    );

    const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    const allPendingSelected =
        pendingRequests.length > 0 && selectedIds.length === pendingRequests.length;

    useEffect(() => {
        setSearchInput(filters.search);
    }, [filters.search]);

    useEffect(() => {
        if (requests.length === 0) {
            setSelectedId(null);

            return;
        }

        if (selectedId === null || !requests.some((request) => request.id === selectedId)) {
            setSelectedId(requests[0]?.id ?? null);
        }
    }, [requests, selectedId]);

    useEffect(() => {
        setSelectedIds([]);
        setRejectionReason('');
    }, [filters.status, filters.search, requests]);

    function navigate(filtersUpdate: Partial<AdminLeaveRequestsPageProps['filters']>) {
        router.get(
            adminLeaveRequests.url({
                query: {
                    status: filtersUpdate.status ?? filters.status,
                    search: filtersUpdate.search ?? filters.search,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    }

    function submitSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        navigate({ search: searchInput.trim() });
    }

    function toggleOne(id: number) {
        setSelectedIds((current) =>
            current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
        );
    }

    function toggleAllPending() {
        setSelectedIds(
            allPendingSelected ? [] : pendingRequests.map((request) => request.id),
        );
    }

    function bulkApproveSelected() {
        const count = selectedIds.length;

        router.post(
            bulkApprove.url(),
            { leave_request_ids: selectedIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds([]);
                    onSuccess(
                        count === 1
                            ? '1 verlofaanvraag goedgekeurd.'
                            : `${count} verlofaanvragen goedgekeurd.`,
                    );
                },
            },
        );
    }

    function approveRequest(request: AdminLeaveRequestListItem) {
        router.post(
            approve.url({ leave_request: request.id }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => onSuccess(`Verlof van ${request.user.name} goedgekeurd.`),
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
            {
                rejection_reason:
                    rejectionReason.trim() !== '' ? rejectionReason.trim() : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => onSuccess(`Verlof van ${request.user.name} afgewezen.`),
            },
        );
    }

    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-wrap gap-2">
                        {STATUS_TABS.map((tab) => (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => navigate({ status: tab.value })}
                                className={cn(
                                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                                    filters.status === tab.value
                                        ? 'border-gray-900 bg-gray-900 text-white'
                                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                                )}
                            >
                                {tab.label}
                                {tab.value === 'pending' ? ` (${counts.pending})` : null}
                                {tab.value === 'approved' ? ` (${counts.approved})` : null}
                                {tab.value === 'rejected' ? ` (${counts.rejected})` : null}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={submitSearch} className="mt-4 flex gap-2">
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Zoek op naam of e-mail"
                            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        />
                        <button
                            type="submit"
                            className="shrink-0 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                        >
                            Zoeken
                        </button>
                    </form>
                </div>

                <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">Aanvragen</h2>
                            <p className="mt-0.5 text-xs text-gray-500">
                                {requests.length === 0
                                    ? 'Geen resultaten voor deze filters.'
                                    : `${requests.length} resultaat${requests.length === 1 ? '' : 'en'}`}
                            </p>
                        </div>
                        {filters.status === 'pending' && pendingRequests.length > 0 ? (
                            <button
                                type="button"
                                onClick={bulkApproveSelected}
                                disabled={selectedIds.length === 0}
                                className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {selectedIds.length === 0
                                    ? 'Geselecteerde goedkeuren'
                                    : selectedIds.length === 1
                                      ? '1 geselecteerde goedkeuren'
                                      : `${selectedIds.length} geselecteerde goedkeuren`}
                            </button>
                        ) : null}
                    </div>

                    {filters.status === 'pending' && pendingRequests.length > 0 ? (
                        <div className="flex items-center gap-2 border-b border-gray-50 px-4 py-2 sm:px-5">
                            <input
                                id="admin-leave-select-all"
                                type="checkbox"
                                checked={allPendingSelected}
                                onChange={toggleAllPending}
                                className="size-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/20"
                            />
                            <label
                                htmlFor="admin-leave-select-all"
                                className="text-xs font-medium text-gray-600"
                            >
                                Alle open selecteren
                            </label>
                        </div>
                    ) : null}

                    {requests.length === 0 ? (
                        <p className="px-4 py-10 text-center text-sm text-gray-500 sm:px-5">
                            Geen verlofaanvragen gevonden.
                        </p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {requests.map((request) => (
                                <li key={request.id}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedId(request.id)}
                                        className={cn(
                                            'flex w-full gap-3 px-4 py-3 text-left transition sm:px-5',
                                            selectedId === request.id
                                                ? 'bg-sky-50/80'
                                                : 'hover:bg-gray-50',
                                        )}
                                    >
                                        {request.can_approve ? (
                                            <input
                                                type="checkbox"
                                                checked={selectedIdSet.has(request.id)}
                                                onChange={(event) => {
                                                    event.stopPropagation();
                                                    toggleOne(request.id);
                                                }}
                                                onClick={(event) => event.stopPropagation()}
                                                aria-label={`Selecteer aanvraag van ${request.user.name}`}
                                                className="mt-1 size-4 shrink-0 rounded border-gray-300 text-gray-900 focus:ring-gray-900/20"
                                            />
                                        ) : (
                                            <span className="mt-1 size-4 shrink-0" aria-hidden />
                                        )}
                                        <span className="min-w-0 flex-1">
                                            <span className="flex flex-wrap items-center gap-2">
                                                <span className="truncate text-sm font-medium text-gray-900">
                                                    {request.user.name}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                                        LEAVE_REQUEST_STATUS_STYLES[request.status],
                                                    )}
                                                >
                                                    {LEAVE_REQUEST_STATUS_LABELS[request.status]}
                                                </span>
                                            </span>
                                            <span className="mt-0.5 block truncate text-xs text-gray-500">
                                                {request.type_label} ·{' '}
                                                {formatDayCount(request.day_count)} ·{' '}
                                                {formatLeavePeriod(request)}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            <aside className="w-full shrink-0 lg:w-80 xl:w-96">
                {selectedRequest === null ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-10 text-center text-sm text-gray-500">
                        Selecteer een aanvraag voor details.
                    </div>
                ) : (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Detail
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-gray-900">
                            {selectedRequest.user.name}
                        </h3>
                        <p className="text-sm text-gray-500">{selectedRequest.user.email}</p>

                        <dl className="mt-4 space-y-3 text-sm">
                            <div>
                                <dt className="text-xs font-medium text-gray-500">Status</dt>
                                <dd className="mt-0.5">
                                    <span
                                        className={cn(
                                            'inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold',
                                            LEAVE_REQUEST_STATUS_STYLES[selectedRequest.status],
                                        )}
                                    >
                                        {LEAVE_REQUEST_STATUS_LABELS[selectedRequest.status]}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500">Type</dt>
                                <dd className="mt-0.5 text-gray-900">
                                    {selectedRequest.type_label}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500">Periode</dt>
                                <dd className="mt-0.5 text-gray-900">
                                    {formatLeavePeriod(selectedRequest)} (
                                    {formatDayCount(selectedRequest.day_count)})
                                </dd>
                            </div>
                            {selectedRequest.notes !== null && selectedRequest.notes !== '' ? (
                                <div>
                                    <dt className="text-xs font-medium text-gray-500">Opmerking</dt>
                                    <dd className="mt-0.5 text-gray-700">{selectedRequest.notes}</dd>
                                </div>
                            ) : null}
                            {selectedRequest.rejection_reason !== null &&
                            selectedRequest.rejection_reason !== '' ? (
                                <div>
                                    <dt className="text-xs font-medium text-gray-500">
                                        Reden afwijzing
                                    </dt>
                                    <dd className="mt-0.5 text-gray-700">
                                        {selectedRequest.rejection_reason}
                                    </dd>
                                </div>
                            ) : null}
                            {selectedRequest.attachment !== null ? (
                                <div>
                                    <dt className="text-xs font-medium text-gray-500">
                                        Attest
                                    </dt>
                                    <dd className="mt-0.5">
                                        <a
                                            href={selectedRequest.attachment.url}
                                            className="font-medium text-gray-800 underline hover:text-gray-950"
                                        >
                                            {selectedRequest.attachment.name}
                                        </a>
                                    </dd>
                                </div>
                            ) : null}
                        </dl>

                        {selectedRequest.can_approve ? (
                            <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
                                <label className="block text-xs font-medium text-gray-600">
                                    Reden bij afwijzen (optioneel)
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(event) =>
                                            setRejectionReason(event.target.value)
                                        }
                                        rows={2}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                    />
                                </label>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => approveRequest(selectedRequest)}
                                        className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                                    >
                                        Goedkeuren
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => rejectRequest(selectedRequest)}
                                        className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        Afwijzen
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </aside>
        </div>
    );
}
