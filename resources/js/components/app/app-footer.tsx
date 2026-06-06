import type { ReactNode } from 'react';

import { Link } from '@inertiajs/react';

import { about, privacy } from '@/routes';

export function AppFooter(): ReactNode {
    return (
        <footer className="mt-auto border-t border-gray-100 bg-white px-6 py-5">
            <div className="mx-auto flex max-w-screen-xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <Link href="/" className="shrink-0 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900">
                    <img
                        src="/img/logoTransparent.png"
                        alt="TimeTraq"
                        className="size-8 object-contain"
                        width={32}
                        height={32}
                        decoding="async"
                        draggable={false}
                    />
                </Link>

                <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-gray-500">
                    <Link href={privacy.url()} className="transition hover:text-gray-900">
                        Privacybeleid
                    </Link>
                    <Link href={about.url()} className="transition hover:text-gray-900">
                        Over TimeTraq
                    </Link>
                </nav>

                <p className="text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} TimeTraq
                </p>
            </div>
        </footer>
    );
}
