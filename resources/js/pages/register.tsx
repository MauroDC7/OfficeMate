import { Form, Head, Link } from '@inertiajs/react';

import { AuthGoogleSection } from '@/components/auth-google';
import { AuthField, AuthPage, authLabelClassName, authSubmitClassName } from '@/components/auth-page';
import { cn } from '@/lib/utils';

const footerLinkClassName = 'font-medium text-red-600 hover:text-red-700';

const roleRowClassName =
    'flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition has-[:checked]:border-red-500/40 has-[:checked]:bg-red-50/50 has-[:focus-within]:ring-2 has-[:focus-within]:ring-red-500/20';

const roleInputClassName =
    'size-4 shrink-0 border-gray-300 text-red-600 focus:ring-red-500/30';

export default function Register() {
    return (
        <>
            <Head title="Registreren" />
            <AuthPage
                title="Welkom bij OfficeMate"
                subtitle="Maak een account om te beginnen."
            >
                <div className="px-8 pt-8 pb-9">
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

                                <button
                                    type="submit"
                                    disabled={processing}
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
                            </div>
                        )}
                    </Form>
                    <AuthGoogleSection buttonLabel="Registreren met Google" />
                </div>
            </AuthPage>
        </>
    );
}
