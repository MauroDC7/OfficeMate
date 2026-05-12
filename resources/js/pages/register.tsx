import { Form, Head, Link } from '@inertiajs/react';

import { AuthField, AuthPage, authSubmitClassName } from '@/components/auth-page';
import { cn } from '@/lib/utils';

const footerLinkClassName = 'font-medium text-red-600 hover:text-red-700';

export default function Register() {
    return (
        <>
            <Head title="Registreren" />
            <AuthPage
                title="Welkom bij OfficeMate"
                subtitle="Maak een account om te beginnen."
            >
                <Form action="/register" method="post" className="px-8 pt-8 pb-9">
                    {({ errors, processing }) => (
                        <div className="space-y-6">
                            <AuthField
                                id="name"
                                label="Naam"
                                type="text"
                                autoComplete="name"
                                placeholder="Je naam"
                                error={errors.name}
                            />
                            <AuthField
                                id="email"
                                label="E-mailadres"
                                type="email"
                                autoComplete="email"
                                placeholder="naam@voorbeeld.nl"
                                error={errors.email}
                            />
                            <AuthField
                                id="password"
                                label="Wachtwoord"
                                type="password"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                error={errors.password}
                            />
                            <AuthField
                                id="password_confirmation"
                                label="Wachtwoord bevestigen"
                                type="password"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                error={errors.password_confirmation}
                            />

                            <button type="submit" disabled={processing} className={cn(authSubmitClassName, 'gap-2')}>
                                <img
                                    src="/img/Register Icons Material Outlined.png"
                                    alt=""
                                    className="size-5 shrink-0 object-contain brightness-0 invert"
                                    width={20}
                                    height={20}
                                    decoding="async"
                                    draggable={false}
                                />
                                {processing ? 'Bezig…' : 'Account aanmaken'}
                            </button>

                            <p className="text-center text-sm text-gray-500">
                                Al een account?{' '}
                                <Link href="/login" className={footerLinkClassName}>
                                    Inloggen
                                </Link>
                            </p>
                        </div>
                    )}
                </Form>
            </AuthPage>
        </>
    );
}
