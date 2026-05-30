import { Head, usePage } from '@inertiajs/react';

import { useAlert } from '@/components/alert';
import { AdminLeaveRequestsWorkspace } from '@/components/leave-requests/admin-leave-requests-workspace';
import { AppLayout } from '@/layouts/app-layout';
import type { AdminLeaveRequestsPageProps } from '@/types/admin-leave-requests';

export default function AdminLeaveRequests() {
    const { organizationName, filters, counts, requests } =
        usePage<AdminLeaveRequestsPageProps>().props;
    const { success } = useAlert();

    const trimmedOrganizationName = organizationName.trim();

    return (
        <AppLayout>
            <Head title="Verlofbeheer" />

            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
                <header className="mb-6">
                    <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                        Verlofbeheer
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        {trimmedOrganizationName !== ''
                            ? `Alle verlofaanvragen van ${trimmedOrganizationName}.`
                            : 'Alle verlofaanvragen van je organisatie.'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                        Als beheerder plan je hier geen eigen verlof. Medewerkers dienen aanvragen
                        in via hun verlofpagina.
                    </p>
                </header>

                <AdminLeaveRequestsWorkspace
                    filters={filters}
                    counts={counts}
                    requests={requests}
                    onSuccess={(message) => success(message)}
                />
            </div>
        </AppLayout>
    );
}
