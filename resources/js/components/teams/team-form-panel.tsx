import { Form } from '@inertiajs/react';
import { useEffect, useId, useRef, useState, type RefObject } from 'react';

import {
    FormStepFooter,
    FormStepIndicator,
    FormStepPanel,
    handleWizardFormKeyDown,
    submitWizardForm,
    tryAdvanceFormStep,
    useWizardFormSubmitGuard,
} from '@/components/form-step-nav';
import { UserPicker } from '@/components/teams/user-picker';
import { cn } from '@/lib/utils';
import { store, update } from '@/routes/teams';
import type { OrganizationUserOption, TeamCard } from '@/types/teams';

type TeamFormPanelProps = {
    mode: 'create' | 'edit';
    team?: TeamCard;
    open: boolean;
    onClose: () => void;
    organizationUsers: OrganizationUserOption[];
    selectedMemberIds: number[];
    onMemberIdsChange: (ids: number[]) => void;
    onSuccess: () => void;
};

const STEPS = ['Team', 'Leden'] as const;

function IconPlus({ className }: { className?: string }) {
    return (
        <svg className={className} width={18} height={18} viewBox="0 0 24 24" aria-hidden fill="none">
            <path
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                d="M12 5v14M5 12h14"
            />
        </svg>
    );
}

function IconPencil({ className }: { className?: string }) {
    return (
        <svg className={className} width={18} height={18} viewBox="0 0 24 24" aria-hidden fill="none">
            <path
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3zM13.5 6.5l3 3"
            />
        </svg>
    );
}

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

function TeamIdentityFields({
    isEdit,
    team,
    nameInputRef,
    errors,
}: {
    isEdit: boolean;
    team?: TeamCard;
    nameInputRef: RefObject<HTMLInputElement | null>;
    errors: Record<string, string>;
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
                <label htmlFor="team-name" className="text-sm font-medium text-gray-800">
                    Teamnaam <span className="text-red-600">*</span>
                </label>
                <input
                    ref={nameInputRef}
                    id="team-name"
                    name="name"
                    required
                    defaultValue={isEdit ? team?.name : undefined}
                    placeholder="bijv. Logistiek A"
                    className={inputClass}
                />
                {errors.name !== undefined ? (
                    <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                ) : null}
            </div>

            <div className="sm:col-span-2">
                <label htmlFor="team-department" className="text-sm font-medium text-gray-800">
                    Afdeling
                </label>
                <input
                    id="team-department"
                    name="department"
                    defaultValue={isEdit ? (team?.department ?? '') : undefined}
                    placeholder="bijv. Operationeel"
                    className={inputClass}
                />
                {errors.department !== undefined ? (
                    <p className="mt-1 text-xs text-red-600">{errors.department}</p>
                ) : null}
            </div>
        </div>
    );
}

export function TeamFormPanel({
    mode,
    team,
    open,
    onClose,
    organizationUsers,
    selectedMemberIds,
    onMemberIdsChange,
    onSuccess,
}: TeamFormPanelProps) {
    const isEdit = mode === 'edit';
    const [step, setStep] = useState(0);
    const titleId = useId();
    const panelRef = useRef<HTMLElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const formContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

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
    }, [open, onClose]);

    useEffect(() => {
        if (open) {
            setStep(0);
        }
    }, [open]);

    useWizardFormSubmitGuard(formContainerRef, true, step, STEPS.length, setStep);

    if (!open || (isEdit && team === undefined)) {
        return null;
    }

    const formConfig = isEdit
        ? update.form.patch({ team: team!.id })
        : store.form.post();

    const wizardHandlers = {
        currentStep: step,
        totalSteps: STEPS.length,
        setStep,
    };

    return (
        <div
            className="fixed inset-0 z-[9990] flex items-end justify-center bg-gray-900/40 p-3 sm:items-center sm:p-4"
            role="presentation"
            onClick={onClose}
        >
            <section
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={cn(
                    'max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl sm:rounded-2xl',
                )}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                            {isEdit ? (
                                <IconPencil className="size-[18px]" />
                            ) : (
                                <IconPlus className="size-[18px]" />
                            )}
                        </span>
                        <div>
                            <h2 id={titleId} className="text-base font-semibold text-gray-900">
                                {isEdit ? 'Team bewerken' : 'Team toevoegen'}
                            </h2>
                            <p className="mt-0.5 text-sm text-gray-500">
                                {isEdit
                                    ? 'Pas naam, afdeling of leden aan.'
                                    : 'Eerst de teamgegevens, daarna de leden.'}
                            </p>
                        </div>
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
                        key={isEdit ? team!.id : 'create'}
                        {...formConfig}
                        noValidate
                        onKeyDown={(event) => handleWizardFormKeyDown(event, wizardHandlers)}
                        onSuccess={() => {
                            if (!isEdit) {
                                onMemberIdsChange([]);
                            }
                            onSuccess();
                            onClose();
                        }}
                        className="space-y-5 px-5 py-5 sm:px-6"
                    >
                        {({ errors, processing, submit }) => (
                            <>
                                <FormStepIndicator steps={STEPS} currentStep={step} />

                                <FormStepPanel step={0} currentStep={step}>
                                    <TeamIdentityFields
                                        isEdit={isEdit}
                                        team={team}
                                        nameInputRef={nameInputRef}
                                        errors={errors}
                                    />
                                </FormStepPanel>

                                <FormStepPanel step={1} currentStep={step}>
                                    <UserPicker
                                        users={organizationUsers}
                                        selectedIds={selectedMemberIds}
                                        onChange={onMemberIdsChange}
                                        disabled={processing}
                                    />
                                    {selectedMemberIds.map((memberId) => (
                                        <input
                                            key={memberId}
                                            type="hidden"
                                            name="member_ids[]"
                                            value={memberId}
                                        />
                                    ))}
                                    {errors['member_ids.0'] ?? errors.member_ids ? (
                                        <p className="-mt-3 text-xs text-red-600">
                                            {errors['member_ids.0'] ?? errors.member_ids}
                                        </p>
                                    ) : null}
                                </FormStepPanel>

                                <FormStepFooter
                                    currentStep={step}
                                    totalSteps={STEPS.length}
                                    processing={processing}
                                    submitLabel={isEdit ? 'Wijzigingen opslaan' : 'Team opslaan'}
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
