import { Form, Head, Link } from '@inertiajs/react';

import { AuthField, AuthPage, authSubmitClassName } from '@/components/auth-page';

const footerLinkClassName = 'font-medium text-red-600 hover:text-red-700';

export default function ForgotPassword() {
    return (
        <>
            <Head title="Wachtwoord vergeten" />
            <AuthPage
                title="Wachtwoord vergeten?"
                subtitle="Vul je e-mailadres in. We sturen je een link om een nieuw wachtwoord in te stellen."
            >
                <div className="px-5 pt-6 pb-7 sm:px-8 sm:pt-8 sm:pb-9">
                    <Form action="/forgot-password" method="post">
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

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={authSubmitClassName}
                                >
                                    {processing ? 'Bezig…' : 'Resetlink versturen'}
                                </button>

                                <p className="text-center text-sm text-gray-500">
                                    <Link href="/login" className={footerLinkClassName}>
                                        Terug naar inloggen
                                    </Link>
                                </p>
                            </div>
                        )}
                    </Form>
                </div>
            </AuthPage>
        </>
    );
}
