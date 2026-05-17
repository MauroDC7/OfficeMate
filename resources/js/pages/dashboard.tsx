import { Head } from '@inertiajs/react';

import { AppLayout } from '@/layouts/app-layout';

export default function Dashboard() {
    return (
        <AppLayout>
            <Head title="Dashboard — medewerker" />
            <main className="p-6">
                <h1 className="text-lg font-semibold tracking-tight text-gray-900">Medewerkersdashboard</h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">
                    Dit is jouw startpagina. Hier kun je straks je uren, taken en aanvragen in één oogopslag zien.
                </p>
            </main>
        </AppLayout>
    );
}
