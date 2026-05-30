import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { useAlert } from '@/components/alert';
import { formatDayCount, formatLeavePeriod } from '@/components/leave-requests/leave-request-helpers';
import { cn } from '@/lib/utils';
import { approve, bulkApprove, reject } from '@/routes/leaveRequests';
import type { AdminDashboardPendingLeave } from '@/types/dashboard';

type AdminPendingLeaveSectionProps = {
    requests: AdminDashboardPendingLeave[];
    totalCount: number;
    onSuccess: (message: string) => void;
};

export function AdminPendingLeaveSection({
    requests,
    totalCount,
    onSuccess,
}: AdminPendingLeaveSectionProps) {
    const { confirm } = useAlert();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const allSelected =
        requests.length > 0 && selectedIds.length === requests.length;

    const selectedCount = selectedIds.length;

    const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    function toggleOne(id: number) {
        setSelectedIds((current) =>
            current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
        );
    }

    function toggleAll() {
        setSelectedIds(allSelected ? [] : requests.map((request) => request.id));
    }

    function bulkApproveSelected() {
        router.post(
            bulkApprove.url(),
            { leave_request_ids: selectedIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds([]);
                    onSuccess(
                        selectedCount === 1
                            ? '1 verlofaanvraag goedgekeurd.'
                            : `${selectedCount} verlofaanvragen goedgekeurd.`,
                    );
                },
            },
        );
    }

    return (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">Verlof in behandeling</h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Goedkeuren of afwijzen voor je organisatie.
                    </p>
                </div>
                {requests.length > 0 ? (
                    <button
                        type="button"
                        onClick={bulkApproveSelected}
                        disabled={selectedCount === 0}
                        className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {selectedCount === 0
                            ? 'Geselecteerde goedkeuren'
                            : selectedCount === 1
                              ? '1 geselecteerde goedkeuren'
                              : `${selectedCount} geselecteerde goedkeuren`}
                    </button>
                ) : null}
            </div>

            {requests.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500 sm:px-5">
                    Geen open verlofaanvragen op dit moment.
                </p>
            ) : (
                <>
                    <div className="flex items-center gap-2 border-b border-gray-50 px-4 py-2 sm:px-5">
                        <input
                            id="leave-select-all"
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            className="size-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/20"
                        />
                        <label htmlFor="leave-select-all" className="text-xs font-medium text-gray-600">
                            Alles selecteren
                        </label>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {requests.map((request) => (
                            <li
                                key={request.id}
                                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5"
                            >
                                <div className="flex min-w-0 flex-1 gap-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedIdSet.has(request.id)}
                                        onChange={() => toggleOne(request.id)}
                                        aria-label={`Selecteer aanvraag van ${request.user.name}`}
                                        className="mt-1 size-4 shrink-0 rounded border-gray-300 text-gray-900 focus:ring-gray-900/20"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-900">
                                            {request.user.name}
                                        </p>
                                        <p className="truncate text-xs text-gray-500">
                                            {request.user.email} · {request.type_label} ·{' '}
                                            {formatDayCount(request.day_count)}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-600">
                                            {formatLeavePeriod(request)}
                                        </p>
                                        {request.notes !== null && request.notes !== '' ? (
                                            <p className="mt-1 text-xs text-gray-500">{request.notes}</p>
                                        ) : null}
                                        {request.attachment !== null ? (
                                            <p className="mt-1 text-xs">
                                                <a
                                                    href={request.attachment.url}
                                                    className="font-medium text-gray-700 underline hover:text-gray-900"
                                                >
                                                    {request.attachment.name}
                                                </a>
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="flex shrink-0 gap-2 sm:ms-7">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.post(
                                                approve.url({ leave_request: request.id }),
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () =>
                                                        onSuccess('Verlofaanvraag goedgekeurd.'),
                                                },
                                            )
                                        }
                                        className={cn(
                                            'flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 sm:flex-none sm:py-1.5 sm:text-xs',
                                        )}
                                    >
                                        Goedkeuren
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
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
                                                    onSuccess: () =>
                                                        onSuccess('Verlofaanvraag afgewezen.'),
                                                },
                                            );
                                        }}
                                        className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:flex-none sm:py-1.5 sm:text-xs"
                                    >
                                        Afwijzen
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {totalCount > requests.length ? (
                <p className="border-t border-gray-100 px-4 py-3 text-center text-xs text-gray-500 sm:px-5">
                    Nog {totalCount - requests.length} andere aanvraag
                    {totalCount - requests.length === 1 ? '' : 'en'} in behandeling. Bulkacties
                    gelden voor de {requests.length} zichtbare rijen.
                </p>
            ) : null}
        </section>
    );
}
