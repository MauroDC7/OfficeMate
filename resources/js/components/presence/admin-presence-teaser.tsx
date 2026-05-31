import { Link } from '@inertiajs/react';

import { formatPresenceSummary } from '@/components/presence/presence-helpers';
import { teams } from '@/routes';
import type { PresenceSummary } from '@/types/presence';

type AdminPresenceTeaserProps = {
    summary: PresenceSummary;
};

export function AdminPresenceTeaser({ summary }: AdminPresenceTeaserProps) {
    return (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">Aanwezigheid vandaag</h2>
                    <p className="mt-0.5 text-xs text-gray-500">{formatPresenceSummary(summary)}</p>
                </div>
                <Link
                    href={teams.url({ query: { tab: 'presence' } })}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
                >
                    Bekijk iedereen
                </Link>
            </div>
        </section>
    );
}
