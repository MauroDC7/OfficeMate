import { Link, usePage } from '@inertiajs/react';

import { UserAvatar } from '@/components/user-avatar';
import { getUserDisplayFullName, getUserFirstName } from '@/lib/user-display';
import { settings } from '@/routes';

type AppHeaderProps = {
    onOpenMobileSidebar: () => void;
};

export function AppHeader({ onOpenMobileSidebar }: AppHeaderProps) {
    const user = usePage().props.auth.user;
    const firstName = getUserFirstName(user);
    const fullName = getUserDisplayFullName(user);
    const title = firstName !== '' ? `Welkom, ${firstName}` : 'Welkom, daar';

    return (
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 shadow-sm sm:h-16 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <button
                    type="button"
                    onClick={onOpenMobileSidebar}
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100 md:hidden"
                    aria-label="Menu openen"
                    aria-haspopup="true"
                >
                    <svg
                        width={22}
                        height={22}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                    >
                        <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <h1 className="min-w-0 truncate text-base font-semibold tracking-tight text-gray-900 sm:text-lg">
                    {title}
                </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                <Link
                    href={settings.url()}
                    className="rounded-full transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                    aria-label={
                        fullName !== ''
                            ? `Instellingen van ${fullName}`
                            : 'Instellingen'
                    }
                >
                    <UserAvatar
                        user={user}
                        className="size-9 sm:size-10"
                        textClassName="text-xs sm:text-sm"
                        title={fullName !== '' ? fullName : undefined}
                    />
                </Link>
            </div>
        </header>
    );
}
