import { Form, Head, Link, usePage } from '@inertiajs/react';

import { AuthField, AuthPage, authSubmitClassName } from '@/components/auth-page';

type ForgotPasswordPageProps = {
    flash?: {
        status?: string | null;
    };
};

const footerLinkClassName = 'font-medium text-red-600 hover:text-red-700';

export default function ForgotPassword() {
    const status = usePage<ForgotPasswordPageProps>().props.flash?.status;

    return (
        <>
            <Head title="Wachtwoord vergeten" />
            <AuthPage
                title="Wachtwoord vergeten?"
                subtitle="Vul je e-mailadres in. We sturen je een link om een nieuw wachtwoord in te stellen."
            >
                <div className="px-8 pt-8 pb-9">
                    {status ? (
                        <p
                            className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                            role="status"
                        >
                            {status}
                        </p>
                    ) : null}
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
