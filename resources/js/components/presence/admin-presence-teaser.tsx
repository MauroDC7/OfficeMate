import { Link } from '@inertiajs/react';

import {
    dashboardSectionClassName,
    dashboardSectionLinkClassName,
} from '@/components/dashboard/dashboard-styles';
import { teams } from '@/routes';
import type { PresenceSummary } from '@/types/presence';

type AdminPresenceTeaserProps = {
    summary: PresenceSummary;
};

const PRESENCE_ROWS: { key: keyof PresenceSummary; label: string }[] = [
    { key: 'in_office', label: 'Op kantoor' },
    { key: 'out_of_office', label: 'Niet op kantoor' },
    { key: 'vacation', label: 'Vakantie' },
    { key: 'sick', label: 'Ziek' },
    { key: 'other_leave', label: 'Overig verlof' },
];

function totalEmployees(summary: PresenceSummary): number {
    return (
        summary.in_office +
        summary.out_of_office +
        summary.vacation +
        summary.sick +
        summary.other_leave
    );
}

export function AdminPresenceTeaser({ summary }: AdminPresenceTeaserProps) {
    const total = totalEmployees(summary);

    return (
        <section className={dashboardSectionClassName}>
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                        Beschikbaarheid vandaag
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                        {total === 0
                            ? 'Nog geen medewerkers in je organisatie.'
                            : `Overzicht van ${total} medewerkers.`}
                    </p>
                </div>
                <Link
                    href={teams.url({ query: { tab: 'people' } })}
                    className={dashboardSectionLinkClassName}
                >
                    Alle medewerkers
                </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5 lg:grid-cols-5">
                {PRESENCE_ROWS.map((row) => (
                    <div
                        key={row.key}
                        className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-3"
                    >
                        <p className="text-2xl font-semibold tabular-nums text-gray-900">
                            {summary[row.key]}
                        </p>
                        <p className="mt-1.5 text-xs text-gray-500">{row.label}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
