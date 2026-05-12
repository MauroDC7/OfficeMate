import { Head } from '@inertiajs/react';

import { AppLayout } from '@/layouts/app-layout';

export default function Dashboard() {
    return (
        <AppLayout>
            <Head title="Dashboard" />
            <main />
        </AppLayout>
    );
}
