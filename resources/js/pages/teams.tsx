import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

import { useAlert } from '@/components/alert';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { settings } from '@/routes';
import { approve, destroy as destroyMembership, reject } from '@/routes/team-memberships';
import { destroy as destroyTeam, join, store, update } from '@/routes/teams';
import type { TeamMembershipRow, TeamMembershipStatus, TeamsPageProps } from '@/types/teams';

const STATUS_LABEL: Record<TeamMembershipStatus, string> = {
    pending: 'In afwachting',
    approved: 'Lid',
    rejected: 'Afgewezen',
};

function membershipForTeam(
    memberships: TeamMembershipRow[],
    teamId: number,
): TeamMembershipRow | undefined {
    return memberships.find((m) => m.team.id === teamId);
}

function TeamRowActions({
    teamId,
    membership,
    isAdmin,
    onEdit,
    onDeleted,
    onLeft,
    onJoined,
}: {
    teamId: number;
    membership: TeamMembershipRow | undefined;
    isAdmin: boolean;
    onEdit: () => void;
    onDeleted: () => void;
    onLeft: () => void;
    onJoined: () => void;
}) {
    const { confirm } = useAlert();

    if (isAdmin) {
        return (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                    Bewerken
                </button>
                <button
                    type="button"
                    onClick={async () => {
                        const accepted = await confirm({
                            message: 'Dit team verwijderen?',
                            confirmLabel: 'Verwijderen',
                            variant: 'danger',
                        });

                        if (!accepted) {
                            return;
                        }

                        router.delete(destroyTeam.url({ team: teamId }), {
                            onSuccess: onDeleted,
                        });
                    }}
                    className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                    Verwijderen
                </button>
            </div>
        );
    }

    if (membership?.status === 'approved') {
        return (
            <button
                type="button"
                onClick={async () => {
                    const accepted = await confirm({
                        message: 'Wil je dit team verlaten?',
                        confirmLabel: 'Verlaten',
                        variant: 'danger',
                    });

                    if (!accepted) {
                        return;
                    }

                    router.delete(destroyMembership.url({ team_membership: membership.id }), {
                        onSuccess: onLeft,
                    });
                }}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
                Verlaten
            </button>
        );
    }

    if (membership?.status === 'pending') {
        return (
            <span className="text-xs font-medium text-amber-700">Aanvraag ingediend</span>
        );
    }

    return (
        <button
            type="button"
            onClick={() =>
                router.post(join.url({ team: teamId }), {
                    onSuccess: onJoined,
                })
            }
            className="rounded-md bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-gray-800"
        >
            Aanvragen
        </button>
    );
}

type TeamsPageErrors = {
    team?: string;
    parent_id?: string;
};

export default function Teams() {
    const { success, warning } = useAlert();
    const page = usePage<TeamsPageProps & { errors?: TeamsPageErrors }>();
    const {
        organization,
        teams,
        myMemberships,
        pendingMemberships,
        isAdmin,
    } = page.props;
    const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
    const shownValidation = useRef<string | null>(null);
    const validationMessage = page.props.errors?.team ?? page.props.errors?.parent_id;

    useEffect(() => {
        if (validationMessage === undefined || validationMessage === '') {
            return;
        }

        if (validationMessage === shownValidation.current) {
            return;
        }

        shownValidation.current = validationMessage;
        warning(validationMessage);
    }, [validationMessage, warning]);

    const parentOptions = teams.filter((t) => t.id !== editingTeamId);

    if (organization === null) {
        return (
            <AppLayout>
                <Head title="Teams" />
                <main className="mx-auto max-w-5xl px-4 py-6">
                    <h1 className="text-lg font-semibold text-gray-900">Teams</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Voer eerst je uitnodigingscode in bij Instellingen om teams te zien.
                    </p>
                    <Link
                        href={settings.url()}
                        className="mt-4 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                        Naar instellingen
                    </Link>
                </main>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Teams" />
            <main className="mx-auto box-border w-full min-w-0 max-w-5xl px-4 py-4 sm:px-5 sm:py-5 md:max-w-6xl md:px-6 lg:max-w-7xl lg:px-8 lg:py-6">
                <h1 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
                    Teams
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                    {organization?.name ?? 'Organisatie'} —{' '}
                    {isAdmin
                        ? 'Beheer de teamstructuur en keur aanvragen goed.'
                        : 'Vraag lidmaatschap aan; een beheerder keurt je aanvraag goed.'}
                </p>

                {myMemberships.length > 0 ? (
                    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-900">Mijn teams</h2>
                        <ul className="mt-3 space-y-2">
                            {myMemberships.map((m) => (
                                <li
                                    key={m.id}
                                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                                >
                                    <span className="font-medium text-gray-900">{m.team.name}</span>
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-0.5 text-xs font-medium',
                                            m.status === 'approved' && 'bg-green-100 text-green-800',
                                            m.status === 'pending' && 'bg-amber-100 text-amber-800',
                                            m.status === 'rejected' && 'bg-gray-100 text-gray-600',
                                        )}
                                    >
                                        {STATUS_LABEL[m.status]}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}

                {isAdmin && pendingMemberships.length > 0 ? (
                    <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50/50 p-5">
                        <h2 className="text-sm font-semibold text-gray-900">Open aanvragen</h2>
                        <ul className="mt-3 space-y-3">
                            {pendingMemberships.map((m) => (
                                <li
                                    key={m.id}
                                    className="flex flex-col gap-2 rounded-lg border border-amber-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {m.user.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {m.user.email} · {m.team.name}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.post(
                                                    approve.url({ team_membership: m.id }),
                                                    {},
                                                    {
                                                        onSuccess: () =>
                                                            success('Lidmaatschap goedgekeurd.'),
                                                    },
                                                )
                                            }
                                            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                                        >
                                            Goedkeuren
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.post(
                                                    reject.url({ team_membership: m.id }),
                                                    {},
                                                    {
                                                        onSuccess: () =>
                                                            success('Lidmaatschap afgewezen.'),
                                                    },
                                                )
                                            }
                                            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Afwijzen
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}

                {isAdmin ? (
                    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-900">Nieuw team</h2>
                        <Form
                            {...store.form.post()}
                            options={{
                                onSuccess: () => success('Team toegevoegd.'),
                            }}
                            className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="min-w-[12rem] flex-1">
                                        <label
                                            htmlFor="team-name"
                                            className="text-xs font-medium text-gray-700"
                                        >
                                            Naam
                                        </label>
                                        <input
                                            id="team-name"
                                            name="name"
                                            required
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        />
                                        {errors.name ? (
                                            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                                        ) : null}
                                    </div>
                                    <div className="min-w-[12rem] flex-1">
                                        <label
                                            htmlFor="team-parent"
                                            className="text-xs font-medium text-gray-700"
                                        >
                                            Onder team (optioneel)
                                        </label>
                                        <select
                                            id="team-parent"
                                            name="parent_id"
                                            defaultValue=""
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        >
                                            <option value="">— Geen —</option>
                                            {teams.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {'\u00a0'.repeat(t.depth * 2)}
                                                    {t.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.parent_id ? (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.parent_id}
                                            </p>
                                        ) : null}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                                    >
                                        Toevoegen
                                    </button>
                                </>
                            )}
                        </Form>
                    </section>
                ) : null}

                <section className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5 py-4">
                        <h2 className="text-sm font-semibold text-gray-900">Teamstructuur</h2>
                    </div>
                    {teams.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-gray-500">Nog geen teams.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {teams.map((team) => {
                                const membership = membershipForTeam(myMemberships, team.id);
                                const isEditing = editingTeamId === team.id;

                                return (
                                    <li key={team.id} className="px-5 py-3">
                                        {isAdmin && isEditing ? (
                                            <Form
                                                {...update.form.patch({ team: team.id })}
                                                options={{
                                                    onSuccess: () => {
                                                        setEditingTeamId(null);
                                                        success('Team bijgewerkt.');
                                                    },
                                                }}
                                                className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
                                            >
                                                {({ errors, processing }) => (
                                                    <>
                                                        <div className="min-w-[10rem] flex-1">
                                                            <input
                                                                name="name"
                                                                defaultValue={team.name}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                            />
                                                            {errors.name ? (
                                                                <p className="mt-1 text-xs text-red-600">
                                                                    {errors.name}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                        <div className="min-w-[10rem] flex-1">
                                                            <select
                                                                name="parent_id"
                                                                defaultValue={
                                                                    team.parent_id?.toString() ?? ''
                                                                }
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                            >
                                                                <option value="">— Geen —</option>
                                                                {parentOptions.map((t) => (
                                                                    <option
                                                                        key={t.id}
                                                                        value={t.id}
                                                                    >
                                                                        {'\u00a0'.repeat(
                                                                            t.depth * 2,
                                                                        )}
                                                                        {t.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="submit"
                                                                disabled={processing}
                                                                className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white"
                                                            >
                                                                Opslaan
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setEditingTeamId(null)
                                                                }
                                                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium"
                                                            >
                                                                Annuleren
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </Form>
                                        ) : (
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <span
                                                    className="text-sm font-medium text-gray-900"
                                                    style={{
                                                        paddingLeft: `${team.depth * 1.25}rem`,
                                                    }}
                                                >
                                                    {team.name}
                                                </span>
                                                <TeamRowActions
                                                    teamId={team.id}
                                                    membership={membership}
                                                    isAdmin={isAdmin}
                                                    onEdit={() => setEditingTeamId(team.id)}
                                                    onDeleted={() => success('Team verwijderd.')}
                                                    onLeft={() => success('Je bent het team verlaten.')}
                                                    onJoined={() => success('Aanvraag ingediend.')}
                                                />
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </main>
        </AppLayout>
    );
}
