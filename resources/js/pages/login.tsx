import { Form, Head } from '@inertiajs/react';

const inputClassName =
    'mt-2 block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-red-500/55 focus:ring-2 focus:ring-red-500/15';

const labelClassName = 'block text-xs font-semibold tracking-wide text-gray-500 uppercase';

const errorClassName = 'mt-2 text-xs font-medium text-red-600';

type LoginFieldProps = {
    id: 'email' | 'password';
    label: string;
    type: 'email' | 'password';
    autoComplete: string;
    placeholder: string;
    error?: string;
};

function LoginField({
    id,
    label,
    type,
    autoComplete,
    placeholder,
    error,
}: LoginFieldProps) {
    return (
        <div>
            <label htmlFor={id} className={labelClassName}>
                {label}
            </label>
            <input
                id={id}
                name={id}
                type={type}
                autoComplete={autoComplete}
                required
                placeholder={placeholder}
                className={inputClassName}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? `${id}-error` : undefined}
            />
            {error ? (
                <p id={`${id}-error`} className={errorClassName} role="alert">
                    {error}
                </p>
            ) : null}
        </div>
    );
}

export default function Login() {
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
                        <Form action="/login" method="post" className="px-8 pt-8 pb-9">
                            {({ errors, processing }) => (
                                <div className="space-y-6">
                                    <LoginField
                                        id="email"
                                        label="E-mailadres"
                                        type="email"
                                        autoComplete="username"
                                        placeholder="naam@voorbeeld.nl"
                                        error={errors.email}
                                    />
                                    <LoginField
                                        id="password"
                                        label="Wachtwoord"
                                        type="password"
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        error={errors.password}
                                    />

                                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 select-none">
                                        <input
                                            name="remember"
                                            type="checkbox"
                                            value="1"
                                            className="size-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        />
                                        Ingelogd blijven
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="mt-2 flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 enabled:active:bg-red-800 disabled:pointer-events-none disabled:opacity-60"
                                    >
                                        {processing ? 'Bezig…' : 'Inloggen'}
                                    </button>
                                </div>
                            )}
                        </Form>
                    </div>
                </div>
            </div>
        </>
    );
}
