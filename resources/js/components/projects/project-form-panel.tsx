import { Form } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';

import {
    FormStepFooter,
    FormStepIndicator,
    FormStepPanel,
    handleWizardFormKeyDown,
    submitWizardForm,
    tryAdvanceFormStep,
    useWizardFormSubmitGuard,
} from '@/components/form-step-nav';
import { PROJECT_STATUS_OPTIONS } from '@/components/projects/project-helpers';
import { TeamPicker } from '@/components/projects/team-picker';
import { cn } from '@/lib/utils';
import { store, update } from '@/routes/projects';
import type {
    OrganizationTeamOption,
    ProjectCard,
    ProjectType,
} from '@/types/projects';

type ProjectFormPanelProps = {
    onClose: () => void;
    teams: OrganizationTeamOption[];
    project?: ProjectCard | null;
    onSuccess: (message: string) => void;
};

const STEPS = ['Basis', 'Type', 'Planning'] as const;

function IconClose({ className }: { className?: string }) {
    return (
        <svg className={className} width={20} height={20} viewBox="0 0 24 24" aria-hidden fill="none">
            <path
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                d="M6 6l12 12M18 6L6 18"
            />
        </svg>
    );
}

const inputClass =
    'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10';

function ProjectTypeFields({
    type,
    onTypeChange,
    project,
    errors,
}: {
    type: ProjectType;
    onTypeChange: (value: ProjectType) => void;
    project: ProjectCard | null;
    errors: Record<string, string>;
}) {
    return (
        <>
            <div>
                <span className="text-sm font-medium text-gray-800">Type</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {(['external', 'internal'] as ProjectType[]).map((option) => (
                        <label
                            key={option}
                            className={cn(
                                'flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition',
                                type === option
                                    ? 'border-gray-900 bg-gray-900 text-white'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400',
                            )}
                        >
                            <input
                                type="radio"
                                name="type"
                                value={option}
                                checked={type === option}
                                onChange={() => onTypeChange(option)}
                                className="sr-only"
                            />
                            {option === 'external' ? 'Extern (klant)' : 'Intern'}
                        </label>
                    ))}
                </div>
                {errors.type !== undefined ? (
                    <p className="mt-1 text-xs text-red-600">{errors.type}</p>
                ) : null}
            </div>

            {type === 'external' ? (
                <div>
                    <label htmlFor="project-client" className="text-sm font-medium text-gray-800">
                        Klantnaam <span className="text-red-600">*</span>
                    </label>
                    <input
                        id="project-client"
                        name="client_name"
                        required
                        defaultValue={project?.client_name ?? ''}
                        placeholder="bijv. Rabobank"
                        className={inputClass}
                    />
                    {errors.client_name !== undefined ? (
                        <p className="mt-1 text-xs text-red-600">{errors.client_name}</p>
                    ) : null}
                </div>
            ) : null}
        </>
    );
}

export function ProjectFormPanel({ onClose, teams, project = null, onSuccess }: ProjectFormPanelProps) {
    const titleId = useId();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const formContainerRef = useRef<HTMLDivElement>(null);

    const isEdit = project !== null;
    const [step, setStep] = useState(0);
    const [type, setType] = useState<ProjectType>(project?.type ?? 'external');
    const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>(
        project?.teams.map((team) => team.id) ?? [],
    );

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const frame = window.requestAnimationFrame(() => {
            nameInputRef.current?.focus();
        });

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.cancelAnimationFrame(frame);
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [onClose]);

    const formProps = isEdit ? update.form.patch({ project: project.id }) : store.form.post();

    const wizardHandlers = {
        currentStep: step,
        totalSteps: STEPS.length,
        setStep,
    };

    useWizardFormSubmitGuard(formContainerRef, true, step, STEPS.length, setStep);

    return (
        <div
            className="fixed inset-0 z-[9990] flex items-end justify-center bg-gray-900/40 p-3 sm:items-center sm:p-4"
            role="presentation"
            onClick={onClose}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl sm:rounded-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
                    <div>
                        <h2 id={titleId} className="text-base font-semibold text-gray-900">
                            {isEdit ? 'Project bewerken' : 'Nieuw project'}
                        </h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {isEdit
                                ? 'Pas de gegevens en status van dit project aan.'
                                : 'Doorloop de stappen om je project aan te maken.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                        aria-label="Sluiten"
                    >
                        <IconClose />
                    </button>
                </div>

                <div ref={formContainerRef}>
                    <Form
                        {...formProps}
                        options={{ preserveScroll: true }}
                        encType="multipart/form-data"
                        noValidate
                        onKeyDown={(event) => handleWizardFormKeyDown(event, wizardHandlers)}
                        onSuccess={() => {
                            onSuccess(isEdit ? 'Project bijgewerkt.' : 'Project aangemaakt.');
                            onClose();
                        }}
                        className="space-y-5 px-5 py-5 sm:px-6"
                    >
                        {({ errors, processing, submit }) => (
                            <>
                                <FormStepIndicator steps={STEPS} currentStep={step} />

                                <FormStepPanel step={0} currentStep={step}>
                                    <div>
                                        <label
                                            htmlFor="project-name"
                                            className="text-sm font-medium text-gray-800"
                                        >
                                            Projectnaam <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            ref={nameInputRef}
                                            id="project-name"
                                            name="name"
                                            required
                                            defaultValue={project?.name}
                                            placeholder="bijv. NFC Betaalsysteem"
                                            className={inputClass}
                                        />
                                        {errors.name !== undefined ? (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.name}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-800">Logo</p>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            Optioneel. JPEG, PNG, WebP of GIF, max. 2&nbsp;MB.
                                        </p>
                                        {project?.logo != null ? (
                                            <img
                                                src={project.logo}
                                                alt=""
                                                className="mt-3 size-16 rounded-lg border border-gray-200 object-cover"
                                            />
                                        ) : null}
                                        <input
                                            id="project-logo"
                                            type="file"
                                            name="logo"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            className="mt-3 max-w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-800 hover:file:bg-gray-200"
                                        />
                                        {errors.logo !== undefined ? (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.logo}
                                            </p>
                                        ) : null}
                                        {project?.logo != null ? (
                                            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-red-600">
                                                <input
                                                    type="checkbox"
                                                    name="remove_logo"
                                                    value="1"
                                                    className="size-4 rounded border-gray-300 text-red-600 focus:ring-red-500/30"
                                                />
                                                Logo verwijderen
                                            </label>
                                        ) : null}
                                    </div>
                                </FormStepPanel>

                                <FormStepPanel step={1} currentStep={step}>
                                    <ProjectTypeFields
                                        type={type}
                                        onTypeChange={setType}
                                        project={project}
                                        errors={errors}
                                    />
                                </FormStepPanel>

                                <FormStepPanel step={2} currentStep={step}>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="project-status"
                                                className="text-sm font-medium text-gray-800"
                                            >
                                                Status
                                            </label>
                                            <select
                                                id="project-status"
                                                name="status"
                                                defaultValue={project?.status ?? 'in_progress'}
                                                className={inputClass}
                                            >
                                                {PROJECT_STATUS_OPTIONS.map((option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.status !== undefined ? (
                                                <p className="mt-1 text-xs text-red-600">
                                                    {errors.status}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="project-budget"
                                                className="text-sm font-medium text-gray-800"
                                            >
                                                Urenbudget
                                            </label>
                                            <input
                                                id="project-budget"
                                                name="hours_budget"
                                                type="number"
                                                min={0}
                                                defaultValue={project?.hours_budget ?? ''}
                                                placeholder="bijv. 1200"
                                                className={inputClass}
                                            />
                                            {errors.hours_budget !== undefined ? (
                                                <p className="mt-1 text-xs text-red-600">
                                                    {errors.hours_budget}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>

                                    <TeamPicker
                                        teams={teams}
                                        selectedIds={selectedTeamIds}
                                        onChange={setSelectedTeamIds}
                                        disabled={processing}
                                    />
                                </FormStepPanel>

                                <FormStepFooter
                                    currentStep={step}
                                    totalSteps={STEPS.length}
                                    processing={processing}
                                    submitLabel={isEdit ? 'Wijzigingen opslaan' : 'Project opslaan'}
                                    onCancel={onClose}
                                    onBack={() =>
                                        setStep((current) => Math.max(current - 1, 0))
                                    }
                                    onNext={(event) => {
                                        event.preventDefault();
                                        const form =
                                            event.currentTarget.closest('form');

                                        if (form instanceof HTMLFormElement) {
                                            tryAdvanceFormStep(form, wizardHandlers);
                                        }
                                    }}
                                    onFinalSubmit={() => {
                                        const form =
                                            formContainerRef.current?.querySelector(
                                                'form',
                                            );

                                        if (form instanceof HTMLFormElement) {
                                            submitWizardForm(
                                                form,
                                                wizardHandlers,
                                                submit,
                                            );
                                        }
                                    }}
                                />
                            </>
                        )}
                    </Form>
                </div>
            </section>
        </div>
    );
}
