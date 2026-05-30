import { router } from '@inertiajs/react';

import { useAlert } from '@/components/alert';
import { formatDayCount, formatLeavePeriod } from '@/components/leave-requests/leave-request-helpers';
import { approve, reject } from '@/routes/leaveRequests';
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

    return (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
                <h2 className="text-sm font-semibold text-gray-900">Verlof in behandeling</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                    Goedkeuren of afwijzen voor je organisatie.
                </p>
            </div>

            {requests.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500 sm:px-5">
                    Geen open verlofaanvragen op dit moment.
                </p>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {requests.map((request) => (
                        <li
                            key={request.id}
                            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5"
                        >
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
                            <div className="flex shrink-0 gap-2">
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
                                    className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 sm:flex-none sm:py-1.5 sm:text-xs"
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
            )}

            {totalCount > requests.length ? (
                <p className="border-t border-gray-100 px-4 py-3 text-center text-xs text-gray-500 sm:px-5">
                    Nog {totalCount - requests.length} andere aanvraag
                    {totalCount - requests.length === 1 ? '' : 'en'} in behandeling.
                </p>
            ) : null}
        </section>
    );
}
