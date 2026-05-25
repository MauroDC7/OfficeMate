import type { ReactNode } from 'react';

import { Link } from '@inertiajs/react';

import { FlashAlerts } from '@/components/flash-alerts';
import { login } from '@/routes';

type LegalDocumentLayoutProps = {
    title: string;
    lastUpdated: string;
    children: ReactNode;
    footer?: ReactNode;
};

export function LegalDocumentLayout({
    title,
    lastUpdated,
    children,
    footer,
}: LegalDocumentLayoutProps): ReactNode {
    return (
        <div className="relative min-h-svh bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-8 sm:py-12">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(220,38,38,0.06),transparent)]"
            />

            <div className="relative mx-auto w-full max-w-3xl">
                <header className="mb-6 flex flex-col items-center text-center sm:mb-8">
                    <Link
                        href={login.url()}
                        className="mb-4 inline-flex rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                    >
                        <img
                            src="/img/logoTransparent.png"
                            alt="TimeTraq"
                            className="size-14 object-contain sm:size-16"
                            width={64}
                            height={64}
                            decoding="async"
                            draggable={false}
                        />
                    </Link>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                        {title}
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">Laatst bijgewerkt: {lastUpdated}</p>
                </header>

                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/60 ring-1 ring-gray-950/5">
                    <div className="px-6 py-8 sm:px-10 sm:py-10">{children}</div>
                    {footer !== undefined ? (
                        <div className="border-t border-gray-100 bg-gray-50/80 px-6 py-4 sm:px-10">
                            {footer}
                        </div>
                    ) : null}
                </div>
            </div>

            <FlashAlerts />
        </div>
    );
}
