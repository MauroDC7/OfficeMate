import { Form, Head, Link } from '@inertiajs/react';

import { AuthGoogleSection } from '@/components/auth-google';
import { AuthField, AuthPage, authSubmitClassName } from '@/components/auth-page';
import { cn } from '@/lib/utils';

const footerLinkClassName = 'font-medium text-red-600 hover:text-red-700';

export default function Login() {
    return (
        <>
            <Head title="Inloggen" />
            <AuthPage
                title="We zijn blij je terug te zien!"
                subtitle="Log in met je account om verder te gaan."
            >
                <div className="px-8 pt-8 pb-9">
                    <Form action="/login" method="post">
                        {({ errors, processing }) => (
                            <div className="space-y-6">
                                <AuthField
                                    id="email"
                                    label="E-mailadres"
                                    type="email"
                                    autoComplete="username"
                                    placeholder="naam@voorbeeld.nl"
                                    error={errors.email}
                                />
                                <AuthField
                                    id="password"
                                    label="Wachtwoord"
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    error={errors.password}
                                />

                                <p className="text-right text-sm">
                                    <Link href="/forgot-password" className={footerLinkClassName}>
                                        Wachtwoord vergeten?
                                    </Link>
                                </p>

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
                                    className={cn(authSubmitClassName, 'gap-2')}
                                >
                                    <img
                                        src="/img/Login Icons Material Outlined.png"
                                        alt=""
                                        className="size-5 shrink-0 object-contain brightness-0 invert"
                                        width={20}
                                        height={20}
                                        decoding="async"
                                        draggable={false}
                                    />
                                    {processing ? 'Bezig…' : 'Inloggen'}
                                </button>

                                <p className="text-center text-sm text-gray-500">
                                    Nog geen account?{' '}
                                    <Link href="/register" className={footerLinkClassName}>
                                        Registreren
                                    </Link>
                                </p>
                            </div>
                        )}
                    </Form>
                    <AuthGoogleSection />
                </div>
            </AuthPage>
        </>
    );
}
