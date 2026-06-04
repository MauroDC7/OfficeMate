import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { useAlert } from '@/components/alert';
import { TimesheetDurationControls } from '@/components/timesheets/timesheet-duration-controls';
import { TimesheetProjectSelect } from '@/components/timesheets/timesheet-project-select';
import {
    formatActivityDayLabel,
    formatMinutesRange,
    formatShortRelativeNl,
    minutesToTimeInput,
    parseTimeInputToMinutes,
    timesheetProjectLabel,
} from '@/components/timesheets/timesheet-helpers';
import { cn } from '@/lib/utils';
import { destroy as destroyEntry } from '@/routes/timesheets/entries';
import {
    approve,
    destroy as destroyProposal,
    store as generateProposals,
    update as updateProposal,
} from '@/routes/timesheets/proposals';
import type {
    TimesheetActivityItem,
    TimesheetProjectOption,
    TimesheetProposalPayload,
} from '@/types/timesheets';

const RELOAD_PROPS = ['recentActivity', 'entriesByDay', 'proposals'] as const;

type TimesheetSuggestionsPanelProps = {
    proposals: TimesheetProposalPayload[];
    recentActivity: TimesheetActivityItem[];
    projectOptions: TimesheetProjectOption[];
    onNavigateToEntryEdit: (entryId: number, workedOnYmd: string) => void;
};

type DraftState = {
    title: string;
    description: string;
    projectId: string;
    start: string;
    end: string;
    worked_on: string;
};

const ICON_BUTTON_CLASS =
    'inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-40 sm:size-8';

function draftFrom(proposal: TimesheetProposalPayload): DraftState {
    return {
        title: proposal.title,
        description: proposal.description ?? '',
        projectId:
            proposal.project_id !== null ? String(proposal.project_id) : '',
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

function slotLabel(workedOn: string, startMin: number, endMin: number): string {
    return `${formatActivityDayLabel(workedOn)} · ${formatMinutesRange(startMin, endMin)}`;
}

export function TimesheetSuggestionsPanel({
    proposals,
    recentActivity,
    projectOptions,
    onNavigateToEntryEdit,
}: TimesheetSuggestionsPanelProps) {
    const { success, confirm } = useAlert();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [generating, setGenerating] = useState(false);
    const [draft, setDraft] = useState<DraftState | null>(null);
    const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});

    const hasProposals = proposals.length > 0;
    const hasActivity = recentActivity.length > 0;
    const isEmpty = !hasProposals && !hasActivity;

    function handleGenerateToday(): void {
        setGenerating(true);
        router.post(
            generateProposals.url(),
            { date: todayLocalYmd() },
            {
                preserveScroll: true,
                onFinish: () => setGenerating(false),
            },
        );
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

    function handleDraftTimeRangeChange(start: string, end: string): void {
        setDraft((current) =>
            current === null ? current : { ...current, start, end },
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
                project_id: draft.projectId === '' ? null : Number(draft.projectId),
                worked_on: draft.worked_on,
                start_minutes: startMinutes ?? 0,
                end_minutes: endMinutes ?? 0,
            },
            {
                preserveScroll: true,
                onError: (errs) =>
                    setDraftErrors(errs as Record<string, string>),
                onSuccess: () => {
                    handleCancelEdit();
                    success('Voorstel bijgewerkt.');
                },
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
                onSuccess: () => success('Voorstel toegevoegd aan je timesheet.'),
                onFinish: () => setBusyId(null),
            },
        );
    }

    async function handleDeleteProposal(proposalId: number): Promise<void> {
        const accepted = await confirm({
            message: 'Voorstel verwijderen?',
            confirmLabel: 'Verwijderen',
            variant: 'danger',
        });

        if (!accepted) {
            return;
        }

        setBusyId(proposalId);
        router.delete(destroyProposal.url({ timesheet_entry_proposal: proposalId }), {
            preserveScroll: true,
            onSuccess: () => success('Voorstel verwijderd.'),
            onFinish: () => setBusyId(null),
        });
    }

    async function handleDeleteEntry(entryId: number): Promise<void> {
        const accepted = await confirm({
            message: 'Deze registratie verwijderen?',
            confirmLabel: 'Verwijderen',
            variant: 'danger',
        });

        if (!accepted) {
            return;
        }

        router.delete(destroyEntry.url({ timesheet_entry: entryId }), {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: [...RELOAD_PROPS] });
                success('Registratie verwijderd.');
            },
        });
    }

    return (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <header className="flex flex-col gap-3 border-b border-gray-100 px-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-4">
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-gray-900">
                        Voorstellen & activiteit
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                        Genereer timesheet-voorstellen uit je desktop-tracker.
                        Keur ze goed of bekijk je laatste registraties hieronder.
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <PrimaryButton
                        onClick={handleGenerateToday}
                        disabled={generating}
                    >
                        {generating
                            ? 'Bezig met genereren…'
                            : hasProposals
                              ? 'Vandaag opnieuw genereren'
                              : 'Genereer voor vandaag'}
                    </PrimaryButton>
                </div>
            </header>

            {isEmpty ? (
                <p className="px-3 py-3 text-center text-xs text-gray-500 sm:px-4">
                    Nog geen voorstellen of recente registraties. Klik op
                    &ldquo;Genereer voor vandaag&rdquo; om te starten.
                </p>
            ) : null}

            {hasProposals ? (
                <div className="border-b border-gray-100">
                    <Subheading>AI-voorstellen</Subheading>
                    <ul className="divide-y divide-gray-100">
                        {proposals.map((proposal) => (
                            <li
                                key={proposal.id}
                                className="px-3 py-2.5 sm:px-4"
                            >
                                {editingId === proposal.id && draft !== null ? (
                                    <ProposalEditForm
                                        draft={draft}
                                        errors={draftErrors}
                                        projectOptions={projectOptions}
                                        submitting={busyId === proposal.id}
                                        onChange={handleDraftChange}
                                        onTimeRangeChange={handleDraftTimeRangeChange}
                                        onSave={() =>
                                            handleSaveEdit(proposal.id)
                                        }
                                        onCancel={handleCancelEdit}
                                    />
                                ) : (
                                    <ProposalRow
                                        proposal={proposal}
                                        busy={busyId === proposal.id}
                                        onEdit={() =>
                                            handleStartEdit(proposal)
                                        }
                                        onApprove={() =>
                                            handleApprove(proposal.id)
                                        }
                                        onDelete={() =>
                                            handleDeleteProposal(proposal.id)
                                        }
                                    />
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {hasActivity ? (
                <div>
                    <Subheading>Recent</Subheading>
                    <ul className="divide-y divide-gray-100">
                        {recentActivity.map((item) => (
                            <ActivityRow
                                key={item.id}
                                item={item}
                                onEdit={onNavigateToEntryEdit}
                                onDelete={handleDeleteEntry}
                            />
                        ))}
                    </ul>
                </div>
            ) : null}
        </section>
    );
}

function Subheading({ children }: { children: ReactNode }) {
    return (
        <h3 className="border-b border-gray-100 bg-gray-50 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-gray-600 uppercase sm:px-4">
            {children}
        </h3>
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                    {proposal.title}
                </p>
                <p className="text-xs text-gray-500">
                    {slotLabel(
                        proposal.worked_on,
                        proposal.start_minutes,
                        proposal.end_minutes,
                    )}
                    {timesheetProjectLabel(proposal) !== null
                        ? ` · ${timesheetProjectLabel(proposal)}`
                        : null}
                </p>
                {proposal.description !== null ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">
                        {proposal.description}
                    </p>
                ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap gap-1.5">
                <SecondaryButton compact onClick={onEdit} disabled={busy}>
                    Aanpassen
                </SecondaryButton>
                <ApproveButton compact onClick={onApprove} disabled={busy}>
                    Goedkeuren
                </ApproveButton>
                <DeleteButton compact onClick={onDelete} disabled={busy}>
                    Verwijderen
                </DeleteButton>
            </div>
        </div>
    );
}

type ActivityRowProps = {
    item: TimesheetActivityItem;
    onEdit: (entryId: number, workedOnYmd: string) => void;
    onDelete: (entryId: number) => void;
};

function ActivityRow({ item, onEdit, onDelete }: ActivityRowProps) {
    const kindLabel = item.kind === 'created' ? 'Nieuw' : 'Bijgewerkt';

    return (
        <li className="flex items-center gap-2 px-3 py-2 sm:px-4">
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                    {item.title}
                </p>
                <p className="truncate text-xs text-gray-500">
                    <span className="text-gray-400">{kindLabel}</span>
                    {' · '}
                    {slotLabel(
                        item.worked_on,
                        item.start_minutes,
                        item.end_minutes,
                    )}
                    {' · '}
                    {formatShortRelativeNl(item.updated_at)}
                </p>
            </div>
            <div className="flex shrink-0 gap-1">
                <button
                    type="button"
                    className={ICON_BUTTON_CLASS}
                    title="Bewerken"
                    aria-label="Bewerken"
                    onClick={() => onEdit(item.id, item.worked_on)}
                >
                    <img
                        src="/img/Edit Icon 48.png"
                        alt=""
                        className="size-4 sm:size-3.5"
                    />
                </button>
                <button
                    type="button"
                    className={cn(
                        ICON_BUTTON_CLASS,
                        'text-red-600 hover:bg-red-50',
                    )}
                    title="Verwijderen"
                    aria-label="Verwijderen"
                    onClick={() => onDelete(item.id)}
                >
                    <IconTrash className="size-4 sm:size-3.5" />
                </button>
            </div>
        </li>
    );
}

function IconTrash({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
        </svg>
    );
}

type ProposalEditFormProps = {
    draft: DraftState;
    errors: Record<string, string>;
    projectOptions: TimesheetProjectOption[];
    submitting: boolean;
    onChange: (field: keyof DraftState, value: string) => void;
    onTimeRangeChange: (start: string, end: string) => void;
    onSave: () => void;
    onCancel: () => void;
};

function ProposalEditForm({
    draft,
    errors,
    projectOptions,
    submitting,
    onChange,
    onTimeRangeChange,
    onSave,
    onCancel,
}: ProposalEditFormProps) {
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onSave();
            }}
            className="space-y-2"
        >
            <Field label="Titel" error={errors.title}>
                <input
                    type="text"
                    value={draft.title}
                    onChange={(event) => onChange('title', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    autoComplete="off"
                />
            </Field>
            <Field label="Beschrijving" error={errors.description}>
                <textarea
                    value={draft.description}
                    onChange={(event) =>
                        onChange('description', event.target.value)
                    }
                    rows={2}
                    className="w-full resize-y rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                />
            </Field>
            <TimesheetProjectSelect
                id={`proposal-project-${draft.worked_on}`}
                value={draft.projectId}
                options={projectOptions}
                onChange={(projectId) => onChange('projectId', projectId)}
                error={errors.project_id}
                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
            />
            <Field label="Datum" error={errors.worked_on}>
                <input
                    type="date"
                    value={draft.worked_on}
                    onChange={(event) =>
                        onChange('worked_on', event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                />
            </Field>
            <TimesheetDurationControls
                start={draft.start}
                end={draft.end}
                disabled={submitting}
                errorStart={errors.start_minutes}
                errorEnd={errors.end_minutes}
                onChange={onTimeRangeChange}
            />

            <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                <SecondaryButton
                    type="button"
                    compact
                    onClick={onCancel}
                    disabled={submitting}
                >
                    Annuleren
                </SecondaryButton>
                <PrimaryButton type="submit" compact disabled={submitting}>
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
            <div className="mt-0.5">{children}</div>
            {error !== undefined ? (
                <span className="mt-0.5 block text-xs text-red-600">
                    {error}
                </span>
            ) : null}
        </label>
    );
}

const BASE_BUTTON =
    'inline-flex items-center justify-center rounded-md font-medium shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const COMPACT_SIZE = 'px-3 py-1.5 text-sm sm:px-2 sm:py-1 sm:text-xs';
const DEFAULT_SIZE = 'px-3 py-2 text-sm';

function ApproveButton({
    children,
    onClick,
    disabled,
    compact,
    type = 'button',
}: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    compact?: boolean;
    type?: 'button' | 'submit';
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                BASE_BUTTON,
                compact ? COMPACT_SIZE : DEFAULT_SIZE,
                'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
            )}
        >
            {children}
        </button>
    );
}

function PrimaryButton({
    children,
    onClick,
    disabled,
    compact,
    type = 'button',
}: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    compact?: boolean;
    type?: 'button' | 'submit';
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                BASE_BUTTON,
                compact ? COMPACT_SIZE : DEFAULT_SIZE,
                'bg-gray-900 text-white hover:bg-gray-800 focus-visible:outline-gray-900',
            )}
        >
            {children}
        </button>
    );
}

function DeleteButton({
    children,
    onClick,
    disabled,
    compact,
    type = 'button',
}: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    compact?: boolean;
    type?: 'button' | 'submit';
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                BASE_BUTTON,
                compact ? COMPACT_SIZE : DEFAULT_SIZE,
                'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:outline-red-600',
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
    compact,
    type = 'button',
}: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    compact?: boolean;
    type?: 'button' | 'submit';
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                BASE_BUTTON,
                compact ? COMPACT_SIZE : DEFAULT_SIZE,
                'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus-visible:outline-gray-900',
            )}
        >
            {children}
        </button>
    );
}
