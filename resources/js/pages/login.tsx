import { Head } from '@inertiajs/react';
import type { FormEvent } from 'react';

export default function Login() {
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
    }

    const inputClassName =
        'mt-2 block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-red-500/55 focus:ring-2 focus:ring-red-500/15';

    return (
        <>
            <Head title="Inloggen" />
            <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-16">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(220,38,38,0.06),transparent)]"
                />

                <div className="relative w-full max-w-[400px]">
                    <header className="mb-10 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                            We zijn blij je terug te zien!
                        </h1>
                        <p className="mt-2 text-sm leading-relaxed text-gray-500">
                            Log in met je account om verder te gaan.
                        </p>
                    </header>

                    <div className="rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/60 ring-1 ring-gray-950/5">
                        <form
                            onSubmit={handleSubmit}
                            className="px-8 pt-8 pb-9"
                        >
                            <div className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-xs font-semibold tracking-wide text-gray-500 uppercase"
                                    >
                                        E-mailadres
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="username"
                                        placeholder="Please enter your email"
                                        className={inputClassName}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-xs font-semibold tracking-wide text-gray-500 uppercase"
                                    >
                                        Wachtwoord
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        className={inputClassName}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="mt-2 flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 active:bg-red-800"
                                >
                                    Inloggen
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
