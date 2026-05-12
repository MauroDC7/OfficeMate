import { Head } from '@inertiajs/react';

import { AppLayout } from '@/layouts/app-layout';

export default function Settings() {
    return (
        <AppLayout>
            <Head title="Instellingen" />
            <main className="mx-auto box-border w-full min-w-0 max-w-5xl px-4 py-4 sm:px-5 sm:py-5 md:max-w-6xl md:px-6 lg:max-w-7xl lg:px-8 lg:py-6 xl:max-w-none xl:px-8 2xl:px-12">
                <h1 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
                    Instellingen
                </h1>
                <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-gray-500 md:max-w-3xl lg:text-base xl:max-w-4xl 2xl:max-w-5xl">
                    Beheer je profiel, notificaties, AI-voorkeuren en integraties.
                </p>

                <div className="box-border mt-5 w-full min-w-0 min-h-[10rem] rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm sm:mt-6 sm:min-h-[12rem] sm:p-5 sm:rounded-2xl md:min-h-[13rem] lg:mt-7 lg:min-h-0 lg:aspect-[7/2] lg:p-6 lg:rounded-2xl" />
            </main>
        </AppLayout>
    );
}
