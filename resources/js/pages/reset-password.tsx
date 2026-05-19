import { Form, Head, Link, usePage } from '@inertiajs/react';

import { AuthField, AuthPage, authLabelClassName, authSubmitClassName } from '@/components/auth-page';

type ResetPasswordPageProps = {
    email: string;
    token: string;
};

const footerLinkClassName = 'font-medium text-red-600 hover:text-red-700';

export default function ResetPassword() {
    const { email, token } = usePage<ResetPasswordPageProps>().props;

    return (
        <>
            <Head title="Nieuw wachtwoord" />
            <AuthPage
                title="Nieuw wachtwoord instellen"
                subtitle="Kies een nieuw wachtwoord voor je account."
            >
                <div className="px-8 pt-8 pb-9">
                    <Form action="/reset-password" method="post">
                        {({ errors, processing }) => (
                            <div className="space-y-6">
                                <input type="hidden" name="token" value={token} />
                                <input type="hidden" name="email" value={email} />

                                <div>
                                    <span className={authLabelClassName}>E-mailadres</span>
                                    <p className="mt-2 text-sm text-gray-800">{email}</p>
                                    {errors.email ? (
                                        <p className="mt-2 text-xs font-medium text-red-600" role="alert">
                                            {errors.email}
                                        </p>
                                    ) : null}
                                </div>

                                <AuthField
                                    id="password"
                                    label="Nieuw wachtwoord"
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

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={authSubmitClassName}
                                >
                                    {processing ? 'Bezig…' : 'Wachtwoord opslaan'}
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
