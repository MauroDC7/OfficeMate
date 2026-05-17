import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import {
    formatActivityDayLabel,
    formatMinutesRange,
    minutesToTimeInput,
    parseTimeInputToMinutes,
} from '@/components/timesheets/timesheet-helpers';
import { cn } from '@/lib/utils';
import {
    approve,
    destroy,
    store as generateProposals,
    update as updateProposal,
} from '@/routes/timesheets/proposals';
import type { TimesheetProposalPayload } from '@/types/timesheets';

type ProposalsStatus = 'ready' | 'unconfigured' | 'no_activity' | 'error';

type FlashProps = {
    proposalsStatus?: ProposalsStatus | null;
    proposalsMessage?: string | null;
};

type SharedProps = {
    flash?: FlashProps;
};

type TimesheetAiProposalsProps = {
    weekStart: string;
    proposals: TimesheetProposalPayload[];
};

type DraftState = {
    title: string;
    description: string;
    client: string;
    start: string;
    end: string;
    worked_on: string;
};

function draftFrom(proposal: TimesheetProposalPayload): DraftState {
    return {
        title: proposal.title,
        description: proposal.description ?? '',
        client: proposal.client_name ?? '',
        start: minutesToTimeInput(proposal.start_minutes),
        end: minutesToTimeInput(proposal.end_minutes),
        worked_on: proposal.worked_on,
    };
}

function todayLocalYmd(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
}

export function TimesheetAiProposals({
    weekStart,
    proposals,
}: TimesheetAiProposalsProps) {
    const flash = usePage<SharedProps>().props.flash ?? {};
    const [editingId, setEditingId] = useState<number | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [generating, setGenerating] = useState(false);
    const [draft, setDraft] = useState<DraftState | null>(null);
    const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});

    const hasProposals = proposals.length > 0;

    function handleGenerate(scope: 'today' | 'week'): void {
        const payload =
            scope === 'today' ? { date: todayLocalYmd() } : { week: weekStart };

        setGenerating(true);
        router.post(generateProposals.url(), payload, {
            preserveScroll: true,
            onFinish: () => setGenerating(false),
        });
    }

    function handleStartEdit(proposal: TimesheetProposalPayload): void {
        setEditingId(proposal.id);
        setDraft(draftFrom(proposal));
        setDraftErrors({});
    }

    function handleCancelEdit(): void {
        setEditingId(null);
        setDraft(null);
        setDraftErrors({});
    }

    function handleDraftChange(field: keyof DraftState, value: string): void {
        setDraft((current) =>
            current === null ? current : { ...current, [field]: value },
        );
    }

    function handleSaveEdit(proposalId: number): void {
        if (draft === null) {
            return;
        }

        const startMinutes = parseTimeInputToMinutes(draft.start);
        const endMinutes = parseTimeInputToMinutes(draft.end);
        const errors: Record<string, string> = {};

        if (draft.title.trim() === '') {
            errors.title = 'Titel is verplicht.';
        }

        if (startMinutes === null) {
            errors.start_minutes = 'Ongeldige starttijd.';
        }

        if (endMinutes === null) {
            errors.end_minutes = 'Ongeldige eindtijd.';
        }

        if (
            startMinutes !== null &&
            endMinutes !== null &&
            endMinutes <= startMinutes
        ) {
            errors.end_minutes = 'Eindtijd moet na starttijd liggen.';
        }

        if (Object.keys(errors).length > 0) {
            setDraftErrors(errors);

            return;
        }

        setBusyId(proposalId);
        router.patch(
            updateProposal.url({ timesheet_entry_proposal: proposalId }),
            {
                title: draft.title.trim(),
                description:
                    draft.description.trim() === ''
                        ? null
                        : draft.description.trim(),
                client_name:
                    draft.client.trim() === '' ? null : draft.client.trim(),
                worked_on: draft.worked_on,
                start_minutes: startMinutes ?? 0,
                end_minutes: endMinutes ?? 0,
            },
            {
                preserveScroll: true,
                onError: (errs) =>
                    setDraftErrors(errs as Record<string, string>),
                onSuccess: () => handleCancelEdit(),
                onFinish: () => setBusyId(null),
            },
        );
    }

    function handleApprove(proposalId: number): void {
        setBusyId(proposalId);
        router.post(
            approve.url({ timesheet_entry_proposal: proposalId }),
            {},
            {
                preserveScroll: true,
                onFinish: () => setBusyId(null),
            },
        );
    }

    function handleDelete(proposalId: number): void {
        if (!window.confirm('Voorstel verwijderen?')) {
            return;
        }

        setBusyId(proposalId);
        router.delete(destroy.url({ timesheet_entry_proposal: proposalId }), {
            preserveScroll: true,
            onFinish: () => setBusyId(null),
        });
    }

    return (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <header className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                    <h2 className="text-base font-semibold text-gray-900">
                        AI-voorstellen
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Gegenereerd uit je desktop-tracker. Pas aan, keur
                        goed of verwijder.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <SecondaryButton
                        onClick={() => handleGenerate('today')}
                        disabled={generating}
                    >
                        {generating ? 'Genereren…' : 'Genereer voor vandaag'}
                    </SecondaryButton>
                    <SecondaryButton
                        onClick={() => handleGenerate('week')}
                        disabled={generating}
                    >
                        {hasProposals ? 'Hele week opnieuw' : 'Hele week'}
                    </SecondaryButton>
                </div>
            </header>

            <FlashBanner flash={flash} />

            {!hasProposals ? (
                <EmptyState />
            ) : (
                <ul className="divide-y divide-gray-100">
                    {proposals.map((proposal) => (
                        <li key={proposal.id} className="px-4 py-4 sm:px-5">
                            {editingId === proposal.id && draft !== null ? (
                                <ProposalEditForm
                                    draft={draft}
                                    errors={draftErrors}
                                    submitting={busyId === proposal.id}
                                    onChange={handleDraftChange}
                                    onSave={() => handleSaveEdit(proposal.id)}
                                    onCancel={handleCancelEdit}
                                />
                            ) : (
                                <ProposalRow
                                    proposal={proposal}
                                    busy={busyId === proposal.id}
                                    onEdit={() => handleStartEdit(proposal)}
                                    onApprove={() => handleApprove(proposal.id)}
                                    onDelete={() => handleDelete(proposal.id)}
                                />
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function FlashBanner({ flash }: { flash: FlashProps }) {
    const status = flash.proposalsStatus ?? null;

    if (status === null) {
        return null;
    }

    const palettes: Record<ProposalsStatus, string> = {
        ready: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        unconfigured: 'border-amber-200 bg-amber-50 text-amber-800',
        no_activity: 'border-blue-200 bg-blue-50 text-blue-800',
        error: 'border-red-200 bg-red-50 text-red-700',
    };

    return (
        <div
            className={cn(
                'border-b px-4 py-3 text-sm sm:px-5',
                palettes[status],
            )}
        >
            {flash.proposalsMessage ?? 'Er ging iets mis bij het genereren.'}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="px-4 py-10 text-center sm:px-5">
            <p className="text-sm text-gray-500">
                Nog geen voorstellen voor deze week.
            </p>
            <p className="mt-1 text-xs text-gray-400">
                Klik op "Genereer voor vandaag" om een AI-suggestie te maken op
                basis van je desktop-tracker.
            </p>
        </div>
    );
}

type ProposalRowProps = {
    proposal: TimesheetProposalPayload;
    busy: boolean;
    onEdit: () => void;
    onApprove: () => void;
    onDelete: () => void;
};

function ProposalRow({
    proposal,
    busy,
    onEdit,
    onApprove,
    onDelete,
}: ProposalRowProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {formatActivityDayLabel(proposal.worked_on)} ·{' '}
                    {formatMinutesRange(
                        proposal.start_minutes,
                        proposal.end_minutes,
                    )}
                </p>
                <p className="mt-1 truncate text-base font-semibold text-gray-900">
                    {proposal.title}
                </p>
                {proposal.client_name !== null ? (
                    <p className="text-sm text-gray-600">
                        Klant: {proposal.client_name}
                    </p>
                ) : null}
                {proposal.description !== null ? (
                    <p className="mt-2 text-sm whitespace-pre-wrap text-gray-700">
                        {proposal.description}
                    </p>
                ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
                <SecondaryButton onClick={onEdit} disabled={busy}>
                    Aanpassen
                </SecondaryButton>
                <PrimaryButton onClick={onApprove} disabled={busy}>
                    Goedkeuren
                </PrimaryButton>
                <DangerButton onClick={onDelete} disabled={busy}>
                    Verwijderen
                </DangerButton>
            </div>
        </div>
    );
}

type ProposalEditFormProps = {
    draft: DraftState;
    errors: Record<string, string>;
    submitting: boolean;
    onChange: (field: keyof DraftState, value: string) => void;
    onSave: () => void;
    onCancel: () => void;
};

function ProposalEditForm({
    draft,
    errors,
    submitting,
    onChange,
    onSave,
    onCancel,
}: ProposalEditFormProps) {
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onSave();
            }}
            className="space-y-3"
        >
            <Field label="Titel" error={errors.title}>
                <input
                    type="text"
                    value={draft.title}
                    onChange={(event) => onChange('title', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    autoComplete="off"
                />
            </Field>
            <Field label="Beschrijving" error={errors.description}>
                <textarea
                    value={draft.description}
                    onChange={(event) =>
                        onChange('description', event.target.value)
                    }
                    rows={3}
                    className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                />
            </Field>
            <Field label="Klantnaam (optioneel)" error={errors.client_name}>
                <input
                    type="text"
                    value={draft.client}
                    onChange={(event) => onChange('client', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    autoComplete="organization"
                />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Datum" error={errors.worked_on}>
                    <input
                        type="date"
                        value={draft.worked_on}
                        onChange={(event) =>
                            onChange('worked_on', event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    />
                </Field>
                <Field label="Van" error={errors.start_minutes}>
                    <input
                        type="time"
                        value={draft.start}
                        onChange={(event) =>
                            onChange('start', event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    />
                </Field>
                <Field label="Tot" error={errors.end_minutes}>
                    <input
                        type="time"
                        value={draft.end}
                        onChange={(event) =>
                            onChange('end', event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    />
                </Field>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <SecondaryButton
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                >
                    Annuleren
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={submitting}>
                    {submitting ? 'Bezig…' : 'Opslaan'}
                </PrimaryButton>
            </div>
        </form>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="text-xs font-medium text-gray-700">{label}</span>
            <div className="mt-1">{children}</div>
            {error !== undefined ? (
                <span className="mt-1 block text-xs text-red-600">{error}</span>
            ) : null}
        </label>
    );
}

const BASE_BUTTON =
    'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

function PrimaryButton({
    children,
    onClick,
    disabled,
    type = 'button',
}: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit';
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                BASE_BUTTON,
                'bg-gray-900 text-white hover:bg-gray-800 focus-visible:outline-gray-900',
            )}
        >
            {children}
        </button>
    );
}

function SecondaryButton({
    children,
    onClick,
    disabled,
    type = 'button',
}: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit';
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                BASE_BUTTON,
                'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus-visible:outline-gray-900',
            )}
        >
            {children}
        </button>
    );
}

function DangerButton({
    children,
    onClick,
    disabled,
    type = 'button',
}: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit';
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                BASE_BUTTON,
                'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:outline-red-600',
            )}
        >
            {children}
        </button>
    );
}
