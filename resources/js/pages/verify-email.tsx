import { Form, Head, Link } from '@inertiajs/react';

import { AuthPage, authSubmitClassName } from '@/components/auth-page';

type VerifyEmailPageProps = {
    email: string | null;
    canResend: boolean;
};

export default function VerifyEmail({ email, canResend }: VerifyEmailPageProps) {
    return (
        <>
            <Head title="Bevestig je e-mailadres" />
            <AuthPage
                title="Bevestig je e-mailadres"
                subtitle="We hebben je een welkomstmail gestuurd met een bevestigingslink."
            >
                <div className="space-y-5 px-5 py-7 sm:px-8 sm:py-9">
                    {email ? (
                        <p className="text-sm leading-relaxed text-gray-600">
                            Klik op de link in de mail die we naar{' '}
                            <span className="font-medium text-gray-900">{email}</span> hebben
                            gestuurd. Daarna is je account actief.
                        </p>
                    ) : (
                        <p className="text-sm leading-relaxed text-gray-600">
                            Klik op de link in je welkomstmail om je account te activeren.
                        </p>
                    )}

                    {canResend ? (
                        <Form action="/email/verification-notification" method="post">
                            {({ processing }) => (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={authSubmitClassName}
                                >
                                    Bevestigingsmail opnieuw versturen
                                </button>
                            )}
                        </Form>
                    ) : null}

                    <p className="text-center text-sm">
                        <Link
                            href="/login"
                            className="font-medium text-red-600 hover:text-red-700"
                        >
                            Terug naar inloggen
                        </Link>
                    </p>
                </div>
            </AuthPage>
        </>
    );
}
