import { Link } from '@inertiajs/react';

import { leaveRequests as adminLeaveRequests } from '@/routes/admin';

type AdminLeaveManagementTeaserProps = {
    pendingCount: number;
};

export function AdminLeaveManagementTeaser({ pendingCount }: AdminLeaveManagementTeaserProps) {
    const detail =
        pendingCount === 0
            ? 'Geen open verlofaanvragen'
            : pendingCount === 1
              ? '1 aanvraag wacht op goedkeuring'
              : `${pendingCount} aanvragen wachten op goedkeuring`;

    return (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">Verlofbeheer</h2>
                    <p className="mt-0.5 text-xs text-gray-500">{detail}</p>
                </div>
                <Link
                    href={adminLeaveRequests.url()}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
                >
                    Alles beheren
                </Link>
            </div>
        </section>
    );
}
