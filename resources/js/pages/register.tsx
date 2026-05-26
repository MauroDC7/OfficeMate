import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

import { AuthGoogleSection } from '@/components/auth-google';
import { AuthField, AuthPage, authErrorClassName, authLabelClassName, authSubmitClassName } from '@/components/auth-page';
import { PasswordFieldWithHints } from '@/components/password-field-with-hints';
import { cn } from '@/lib/utils';
import { privacy } from '@/routes';

const footerLinkClassName = 'font-medium text-red-600 hover:text-red-700';

const roleRowClassName =
    'flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition has-[:checked]:border-red-500/40 has-[:checked]:bg-red-50/50 has-[:focus-within]:ring-2 has-[:focus-within]:ring-red-500/20';

const roleInputClassName =
    'size-4 shrink-0 border-gray-300 text-red-600 focus:ring-red-500/30';

const privacyRowClassName =
    'flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm transition has-[:checked]:border-red-500/40 has-[:checked]:bg-red-50/50 has-[:focus-within]:ring-2 has-[:focus-within]:ring-red-500/20';

type RegisterPageProps = {
    inviteEmail: string | null;
};

export default function Register() {
    const inviteEmail = usePage<RegisterPageProps>().props.inviteEmail;
    const fromInvite = inviteEmail !== null && inviteEmail !== '';
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    return (
        <>
            <Head title="Registreren" />
            <AuthPage
                title={fromInvite ? 'Uitnodiging accepteren' : 'Welkom bij TimeTraq'}
                subtitle={
                    fromInvite
                        ? 'Maak je account aan om deel te nemen aan het bedrijf.'
                        : 'Maak een account om te beginnen.'
                }
            >
                <div className="px-5 pt-6 pb-7 sm:px-8 sm:pt-8 sm:pb-9">
                    <Form action="/register" method="post">
                        {({ errors, processing }) => (
                            <div className="space-y-6">
                                <AuthField
                                    id="first_name"
                                    label="Voornaam"
                                    type="text"
                                    autoComplete="given-name"
                                    placeholder="Voornaam"
                                    error={errors.first_name}
                                />
                                <AuthField
                                    id="last_name"
                                    label="Achternaam"
                                    type="text"
                                    autoComplete="family-name"
                                    placeholder="Achternaam"
                                    error={errors.last_name}
                                />

                                {fromInvite ? null : (
                                    <fieldset>
                                        <legend className={authLabelClassName}>Rol</legend>
                                        <div
                                            className="mt-2 space-y-2"
                                            role="radiogroup"
                                            aria-label="Rol"
                                        >
                                            <label className={roleRowClassName}>
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value="employee"
                                                    defaultChecked
                                                    className={roleInputClassName}
                                                />
                                                <span className="font-medium text-gray-800">
                                                    Medewerker
                                                </span>
                                            </label>
                                            <label className={roleRowClassName}>
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value="admin"
                                                    className={roleInputClassName}
                                                />
                                                <span className="font-medium text-gray-800">
                                                    Beheerder
                                                </span>
                                            </label>
                                        </div>
                                        {errors.role ? (
                                            <p
                                                className="mt-2 text-xs font-medium text-red-600"
                                                role="alert"
                                            >
                                                {errors.role}
                                            </p>
                                        ) : null}
                                    </fieldset>
                                )}

                                {fromInvite ? (
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className={authLabelClassName}
                                        >
                                            E-mailadres
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            readOnly
                                            value={inviteEmail}
                                            className="mt-2 block w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700"
                                        />
                                        {errors.email ? (
                                            <p
                                                className="mt-2 text-xs font-medium text-red-600"
                                                role="alert"
                                            >
                                                {errors.email}
                                            </p>
                                        ) : null}
                                    </div>
                                ) : (
                                    <AuthField
                                        id="email"
                                        label="E-mailadres"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="naam@voorbeeld.nl"
                                        error={errors.email}
                                    />
                                )}
                                <PasswordFieldWithHints
                                    label="Wachtwoord"
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

                                <div>
                                    <label className={privacyRowClassName}>
                                        <input
                                            type="checkbox"
                                            name="privacy_policy_accepted"
                                            value="1"
                                            checked={privacyAccepted}
                                            onChange={(event) =>
                                                setPrivacyAccepted(event.target.checked)
                                            }
                                            required
                                            className="mt-0.5 size-4 shrink-0 rounded border-gray-300 text-red-600 focus:ring-red-500/30"
                                        />
                                        <span>
                                            Ik ga akkoord met het{' '}
                                            <Link
                                                href={privacy.url()}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-red-600 underline decoration-red-600/30 underline-offset-2 hover:text-red-700"
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                privacybeleid
                                            </Link>
                                            .
                                        </span>
                                    </label>
                                    {errors.privacy_policy_accepted !== undefined ? (
                                        <p className={authErrorClassName} role="alert">
                                            {errors.privacy_policy_accepted}
                                        </p>
                                    ) : null}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || !privacyAccepted}
                                    className={cn(authSubmitClassName, 'gap-2')}
                                >
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
                                <p className="text-center text-sm text-gray-500">
                                    <Link href="/forgot-password" className={footerLinkClassName}>
                                        Wachtwoord vergeten?
                                    </Link>
                                </p>
                            </div>
                        )}
                    </Form>
                    {fromInvite ? null : (
                        <AuthGoogleSection
                            buttonLabel="Registreren met Google"
                            requirePrivacyAcceptance
                            privacyAccepted={privacyAccepted}
                        />
                    )}
                </div>
            </AuthPage>
        </>
    );
}
