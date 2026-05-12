import { usePage } from '@inertiajs/react';

export function AppHeader() {
    const name = usePage().props.auth.user?.name?.trim();
    const title = name ? `Welkom, ${name}` : 'Welkom, daar';
    const initial = name ? name.charAt(0).toUpperCase() : '?';

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

                <div
                    className="flex size-10 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white shadow-sm"
                    aria-hidden
                >
                    {initial}
                </div>
            </div>
        </header>
    );
}
