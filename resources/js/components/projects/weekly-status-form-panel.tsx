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
import { fetchWeeklyDebriefDraft } from '@/components/projects/fetch-weekly-debrief-draft';
import { cn } from '@/lib/utils';
import { store } from '@/routes/weekly-status';
import type { ProjectsPageProps } from '@/types/projects';

type WeeklyStatusFormPanelProps = {
    weeklyStatus: NonNullable<ProjectsPageProps['weeklyStatus']>;
    onClose: () => void;
    onSuccess?: () => void;
};

const STEPS = ['Deze week', 'Volgende week'] as const;

const inputClass =
    'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10';

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

export function WeeklyStatusFormPanel({ weeklyStatus, onClose, onSuccess }: WeeklyStatusFormPanelProps) {
    const titleId = useId();
    const [step, setStep] = useState(0);
    const [difficult, setDifficult] = useState(weeklyStatus.difficult_this_week ?? '');
    const [plans, setPlans] = useState(weeklyStatus.plans_next_week ?? '');
    const [draftLoading, setDraftLoading] = useState(false);
    const [draftError, setDraftError] = useState<string | null>(null);
    const formContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [onClose]);

    async function loadDraft() {
        setDraftLoading(true);
        setDraftError(null);

        const result = await fetchWeeklyDebriefDraft(weeklyStatus.week_start);

        setDraftLoading(false);

        if ('error' in result) {
            setDraftError(result.error);

            return;
        }

        setDifficult(result.draft.difficult_this_week);
        setPlans(result.draft.plans_next_week);
    }

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
                className={cn(
                    'max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-xl border bg-white shadow-xl sm:rounded-2xl',
                    weeklyStatus.reminder_due ? 'border-amber-300' : 'border-gray-200',
                )}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
                    <div>
                        <h2 id={titleId} className="text-base font-semibold text-gray-900">
                            Weekstatus
                        </h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            Wat was moeilijk deze week en wat staat er volgende week op de planning?
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
                        {...store.form.post()}
                        key={weeklyStatus.week_start}
                        options={{ preserveScroll: true }}
                        noValidate
                        onKeyDown={(event) => handleWizardFormKeyDown(event, wizardHandlers)}
                        onSuccess={() => {
                            onSuccess?.();
                            onClose();
                        }}
                        className="space-y-5 px-5 py-5 sm:px-6"
                    >
                        {({ errors, processing, submit }) => (
                            <>
                                <input
                                    type="hidden"
                                    name="week_start"
                                    value={weeklyStatus.week_start}
                                />

                                <FormStepIndicator steps={STEPS} currentStep={step} />

                                <FormStepPanel step={0} currentStep={step}>
                                    {weeklyStatus.ai_draft_available ? (
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                                            <p className="text-xs text-gray-600">
                                                Op basis van je geregistreerde uren deze week kun je een voorstel laten
                                                invullen. Je past het altijd zelf aan vóór je opslaat.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => void loadDraft()}
                                                disabled={draftLoading || processing}
                                                className="mt-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
                                            >
                                                {draftLoading ? 'Voorstel laden…' : 'Vul voorstel in'}
                                            </button>
                                            {draftError !== null ? (
                                                <p className="mt-2 text-xs text-red-600">{draftError}</p>
                                            ) : null}
                                        </div>
                                    ) : null}

                                    <div>
                                        <label
                                            htmlFor="weekly-difficult"
                                            className="text-sm font-medium text-gray-800"
                                        >
                                            Wat was er deze week moeilijk?{' '}
                                            <span className="text-red-600">*</span>
                                        </label>
                                        <textarea
                                            id="weekly-difficult"
                                            name="difficult_this_week"
                                            rows={4}
                                            required
                                            value={difficult}
                                            onChange={(event) => setDifficult(event.target.value)}
                                            placeholder="Bijv. complexe bug, onduidelijke requirements…"
                                            className={inputClass}
                                        />
                                        {errors.difficult_this_week ? (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.difficult_this_week}
                                            </p>
                                        ) : null}
                                    </div>
                                </FormStepPanel>

                                <FormStepPanel step={1} currentStep={step}>
                                    <div>
                                        <label
                                            htmlFor="weekly-plans"
                                            className="text-sm font-medium text-gray-800"
                                        >
                                            Wat ga je volgende week doen?{' '}
                                            <span className="text-red-600">*</span>
                                        </label>
                                        <textarea
                                            id="weekly-plans"
                                            name="plans_next_week"
                                            rows={4}
                                            required
                                            value={plans}
                                            onChange={(event) => setPlans(event.target.value)}
                                            placeholder="Bijv. feature afronden, sprint planning…"
                                            className={inputClass}
                                        />
                                        {errors.plans_next_week ? (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.plans_next_week}
                                            </p>
                                        ) : null}
                                    </div>
                                </FormStepPanel>

                                <FormStepFooter
                                    currentStep={step}
                                    totalSteps={STEPS.length}
                                    processing={processing}
                                    submitLabel="Opslaan"
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
