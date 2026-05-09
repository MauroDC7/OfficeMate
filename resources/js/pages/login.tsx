import { AuthField, AuthPage, authSubmitClassName } from '@/components/auth-page';
import { Form, Head, Link } from '@inertiajs/react';

const footerLinkClassName = 'font-medium text-red-600 hover:text-red-700';

export default function Login() {
    return (
        <>
            <Head title="Inloggen" />
            <AuthPage
                title="We zijn blij je terug te zien!"
                subtitle="Log in met je account om verder te gaan."
            >
                <Form action="/login" method="post" className="px-8 pt-8 pb-9">
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

                            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 select-none">
                                <input
                                    name="remember"
                                    type="checkbox"
                                    value="1"
                                    className="size-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                Ingelogd blijven
                            </label>

                            <button type="submit" disabled={processing} className={authSubmitClassName}>
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
            </AuthPage>
        </>
    );
}
