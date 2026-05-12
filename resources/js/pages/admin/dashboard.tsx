import { Head } from '@inertiajs/react';

import { AppLayout } from '@/layouts/app-layout';

export default function AdminDashboard() {
    return (
        <AppLayout>
            <Head title="Dashboard — beheerder" />
            <main className="p-6">
                <h1 className="text-lg font-semibold tracking-tight text-gray-900">Beheerdersdashboard</h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">
                    Dit is het dashboard voor beheerders. Dezelfde navigatie als medewerkers; hier kun je straks
                    instellingen, team en rapportages centraal beheren.
                </p>
            </main>
        </AppLayout>
    );
}
