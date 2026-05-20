import { Form, Head, Link, usePage } from '@inertiajs/react';

import { useAlert } from '@/components/alert';
import { UserAvatar } from '@/components/user-avatar';
import { AppLayout } from '@/layouts/app-layout';
import { getUserDisplayFullName, getUserInitials } from '@/lib/user-display';
import { logout } from '@/routes';
import { update as updateSettingsAccount } from '@/routes/settings/account';
import { store as generateOrganizationInvite } from '@/routes/settings/organization-invites';
import { redeem as redeemOrganizationInvite } from '@/routes/settings/organization-invite';
import { update as updateOrganization } from '@/routes/settings/organization';
import type { Auth, User } from '@/types/auth';
import type { OrganizationSummary } from '@/types/teams';

type SettingsPageProps = {
    auth: Auth;
    organization: OrganizationSummary | null;
    canRedeemInvite: boolean;
    organizationInviteCode: string | null;
};

function IconUserOutline({ className }: { className?: string }) {
    return (
        <svg className={className} width={20} height={20} viewBox="0 0 24 24" aria-hidden fill="none">
            <path
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 18.698a8.963 8.963 0 0115.997 0A17.94 17.94 0 0112 21.75c-2.677 0-5.217-.579-7.498-1.652"
            />
        </svg>
    );
}

function IconEnvelopeOutline({ className }: { className?: string }) {
    return (
        <svg className={className} width={18} height={18} viewBox="0 0 24 24" aria-hidden fill="none">
            <path
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.357 8.734 9.553 6.069 9.58-6.069M21 17V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-9.267"
            />
        </svg>
    );
}

function formalName(user: User | null): string {
    if (!user) {
        return '';
    }

    const first = user.first_name?.trim() ?? '';
    const last = user.last_name?.trim() ?? '';

    if (first !== '' && last !== '') {
        return `${last} ${first}`;
    }

    return getUserDisplayFullName(user);
}

export default function Settings() {
    const {
        auth,
        organization,
        canRedeemInvite,
        organizationInviteCode,
    } = usePage<SettingsPageProps>().props;
    const { success } = useAlert();
    const user = auth.user;
    const isAdmin = auth.isAdmin;

    const primaryNameLine = formalName(user);
    const initials = getUserInitials(user);
    const usernameSubtitle = user?.username?.trim() ?? '';

    const hasPhoto = user?.avatar !== undefined && user.avatar !== null && user.avatar !== '';

    return (
        <AppLayout>
            <Head title="Instellingen" />
            <main className="mx-auto box-border w-full min-w-0 max-w-5xl px-4 py-4 sm:px-5 sm:py-5 md:max-w-6xl md:px-6 lg:max-w-7xl lg:px-8 lg:py-6 xl:max-w-none xl:px-8 2xl:px-12">
                <h1 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
                    Instellingen
                </h1>
                <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-gray-500 md:max-w-3xl lg:text-base xl:max-w-4xl 2xl:max-w-5xl">
                    Beheer je profiel, notificaties, AI-voorkeuren en integraties.
                </p>

                <section
                    className="mt-5 w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:mt-6 sm:rounded-2xl lg:mt-7"
                    aria-labelledby="account-card-title"
                >
                    <div className="flex items-center gap-2.5 border-b border-gray-200 px-5 py-4 sm:px-6 sm:py-5">
                        <IconUserOutline className="shrink-0 text-gray-700" />
                        <h2 id="account-card-title" className="text-base font-semibold text-gray-900">
                            Account
                        </h2>
                    </div>

                    <div className="flex flex-col gap-0 px-5 sm:px-6">
                        <div className="flex items-center gap-4 py-5">
                            <UserAvatar user={user} className="size-12 text-sm" />
                            <div className="min-w-0">
                                <p className="truncate text-base font-semibold text-gray-900">
                                    {primaryNameLine !== '' ? primaryNameLine : '—'}
                                </p>
                                {usernameSubtitle !== '' ? (
                                    <p className="mt-0.5 truncate text-sm text-gray-500">{usernameSubtitle}</p>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-t border-gray-200 py-5">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                <IconEnvelopeOutline className="shrink-0 text-gray-600" />
                                <span>E-mailadres</span>
                            </div>
                            <p className="mt-2 break-all text-sm text-gray-800">{user?.email ?? '—'}</p>
                        </div>

                        <Form
                            key={`account-${user?.updated_at ?? '0'}`}
                            {...updateSettingsAccount.form.patch()}
                            options={{
                                preserveScroll: true,
                                onSuccess: () => success('Profiel opgeslagen.'),
                            }}
                            encType="multipart/form-data"
                            className="border-t border-gray-200 py-5"
                        >
                            {({ errors, processing }) => (
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="settings-username" className="text-sm font-medium text-gray-900">
                                            Gebruikersnaam
                                        </label>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            Optioneel. Letters, cijfers, streepjes en underscores (min. 3 tekens).
                                        </p>
                                        <input
                                            id="settings-username"
                                            type="text"
                                            name="username"
                                            autoComplete="username"
                                            defaultValue={user?.username ?? ''}
                                            placeholder="bijv. mauro_dc"
                                            className="mt-2 w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                        />
                                        {errors.username !== undefined ? (
                                            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                                        ) : null}
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Profielfoto</p>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            JPEG, PNG, WebP of GIF, max. 2&nbsp;MB. Zonder foto tonen we je initialen (
                                            {initials}).
                                        </p>
                                        <div className="mt-3 flex flex-wrap items-center gap-4">
                                            <UserAvatar user={user} className="size-16 text-base" />
                                            <input
                                                id="settings-avatar"
                                                type="file"
                                                name="avatar"
                                                accept="image/jpeg,image/png,image/webp,image/gif"
                                                className="max-w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-800 hover:file:bg-gray-200"
                                            />
                                        </div>
                                        {errors.avatar !== undefined ? (
                                            <p className="mt-1 text-sm text-red-600">{errors.avatar}</p>
                                        ) : null}
                                        {hasPhoto ? (
                                            <div className="mt-4">
                                                <button
                                                    type="submit"
                                                    name="remove_avatar"
                                                    value="1"
                                                    disabled={processing}
                                                    className="text-sm font-medium text-red-600 underline decoration-red-600/30 underline-offset-2 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Profielfoto verwijderen
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {processing ? 'Opslaan…' : 'Opslaan'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Form>

                        <div className="flex flex-col gap-4 border-t border-gray-200 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                            <div className="min-w-0">
                                <p className="text-base font-semibold text-gray-900">Uitloggen</p>
                                <p className="mt-0.5 text-sm text-gray-500">Log uit van je account.</p>
                            </div>
                            <Link
                                href={logout.url()}
                                method="post"
                                as="button"
                                className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:self-auto"
                            >
                                <img
                                    src="/img/Logout Icons Material Outlined.png"
                                    alt=""
                                    className="size-5 shrink-0 object-contain brightness-0 invert"
                                    width={20}
                                    height={20}
                                    decoding="async"
                                    draggable={false}
                                />
                                Uitloggen
                            </Link>
                        </div>
                    </div>
                </section>

                {canRedeemInvite ? (
                    <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:mt-6">
                        <h2 className="text-base font-semibold text-gray-900">Bedrijf</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Voer de eenmalige code in die je van je beheerder hebt gekregen.
                        </p>
                        <Form
                            {...redeemOrganizationInvite.form.post()}
                            options={{ preserveScroll: true }}
                            className="mt-4 max-w-md space-y-4"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div>
                                        <label
                                            htmlFor="invite-code"
                                            className="text-sm font-medium text-gray-900"
                                        >
                                            Uitnodigingscode
                                        </label>
                                        <input
                                            id="invite-code"
                                            name="code"
                                            required
                                            autoComplete="off"
                                            placeholder="bijv. A1B2C3D4"
                                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm uppercase tracking-wider"
                                        />
                                        {errors.code !== undefined ? (
                                            <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                                        ) : null}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                                    >
                                        {processing ? 'Bezig…' : 'Deelnemen'}
                                    </button>
                                </>
                            )}
                        </Form>
                    </section>
                ) : null}

                {organization !== null && !canRedeemInvite && !isAdmin ? (
                    <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:mt-6">
                        <h2 className="text-base font-semibold text-gray-900">Bedrijf</h2>
                        <p className="mt-2 text-sm text-gray-800">{organization.name}</p>
                    </section>
                ) : null}

                {isAdmin && organization !== null ? (
                    <section
                        className="mt-5 w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:mt-6 sm:rounded-2xl"
                        aria-labelledby="organization-card-title"
                    >
                        <div className="flex items-center gap-2.5 border-b border-gray-200 px-5 py-4 sm:px-6 sm:py-5">
                            <h2 id="organization-card-title" className="text-base font-semibold text-gray-900">
                                Organisatie
                            </h2>
                        </div>
                        <Form
                            key={`organization-${organization.id}`}
                            {...updateOrganization.form.patch({ organization: organization.id })}
                            options={{
                                preserveScroll: true,
                                onSuccess: () => success('Organisatie opgeslagen.'),
                            }}
                            className="border-b border-gray-200 px-5 py-5 sm:px-6"
                        >
                            {({ errors, processing }) => (
                                <div className="max-w-md space-y-4">
                                    <div>
                                        <label
                                            htmlFor="organization-name"
                                            className="text-sm font-medium text-gray-900"
                                        >
                                            Bedrijfsnaam
                                        </label>
                                        <input
                                            id="organization-name"
                                            type="text"
                                            name="name"
                                            required
                                            defaultValue={organization.name}
                                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                        />
                                        {errors.name !== undefined ? (
                                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                        ) : null}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processing ? 'Opslaan…' : 'Opslaan'}
                                    </button>
                                </div>
                            )}
                        </Form>
                        <div className="px-5 py-5 sm:px-6">
                            <p className="text-sm font-medium text-gray-900">Uitnodigingscode</p>
                            <p className="mt-1 text-xs text-gray-500">
                                Genereer een code voor één medewerker. De code werkt één keer.
                            </p>
                            {organizationInviteCode !== null && organizationInviteCode !== '' ? (
                                <p className="mt-3 rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm tracking-wider text-gray-900">
                                    {organizationInviteCode}
                                </p>
                            ) : null}
                            <Form
                                {...generateOrganizationInvite.form.post()}
                                options={{
                                    onSuccess: () => success('Uitnodigingscode gegenereerd.'),
                                }}
                                className="mt-4"
                            >
                                {({ processing }) => (
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
                                    >
                                        {processing ? 'Genereren…' : 'Nieuwe code genereren'}
                                    </button>
                                )}
                            </Form>
                        </div>
                    </section>
                ) : null}
            </main>
        </AppLayout>
    );
}
