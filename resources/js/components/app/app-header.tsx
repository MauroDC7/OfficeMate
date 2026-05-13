import { usePage } from '@inertiajs/react';

import { UserAvatar } from '@/components/user-avatar';
import { getUserDisplayFullName, getUserFirstName } from '@/lib/user-display';

export function AppHeader() {
    const user = usePage().props.auth.user;
    const firstName = getUserFirstName(user);
    const fullName = getUserDisplayFullName(user);
    const title = firstName !== '' ? `Welkom, ${firstName}` : 'Welkom, daar';

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h1>

            <div className="flex items-center gap-4">
                <button
                    type="button"
                    className="relative rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                    title="Meldingen"
                    aria-label="Meldingen"
                >
                    <img
                        src="/img/Notification Icon 24.png"
                        alt=""
                        className="size-6 shrink-0 object-contain"
                        width={24}
                        height={24}
                        decoding="async"
                        draggable={false}
                    />
                    <span className="absolute end-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
                </button>

                <UserAvatar
                    user={user}
                    className="size-10"
                    textClassName="text-xs sm:text-sm"
                    title={fullName !== '' ? fullName : undefined}
                />
            </div>
        </header>
    );
}
