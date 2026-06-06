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
import {
    LEAVE_TYPE_LABELS,
    LEAVE_TYPE_PRIMARY_OPTIONS,
} from '@/components/leave-requests/leave-request-helpers';
import { cn } from '@/lib/utils';
import { store, update } from '@/routes/leaveRequests';
import type { LeaveRequestListItem, LeaveType } from '@/types/leave-requests';

type LeaveRequestFormPanelProps = {
    onClose: () => void;
    onSuccess: (message: string) => void;
    request?: LeaveRequestListItem | null;
};

const STEPS = ['Type', 'Periode', 'Extra'] as const;

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

const typeOptionClass = (selected: boolean, spansFullWidth = false) =>
    cn(
        'flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition',
        spansFullWidth && 'col-span-2',
        selected
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400',
    );

function TypeOption({
    value,
    label,
    src,
    selected,
    onSelect,
    spansFullWidth = false,
}: {
    value: LeaveType;
    label: string;
    src?: string;
    selected: boolean;
    onSelect: (value: LeaveType) => void;
    spansFullWidth?: boolean;
}) {
    return (
        <label className={typeOptionClass(selected, spansFullWidth)}>
            <input
                type="radio"
                name="type"
                value={value}
                checked={selected}
                onChange={() => onSelect(value)}
                className="sr-only"
            />
            {src !== undefined ? (
                <img
                    src={src}
                    alt=""
                    className="size-5 shrink-0 object-contain"
                    width={20}
                    height={20}
                    decoding="async"
                    draggable={false}
                />
            ) : null}
            {label}
        </label>
    );
}

function LeaveTypeFields({
    type,
    onTypeChange,
    error,
}: {
    type: LeaveType;
    onTypeChange: (value: LeaveType) => void;
    error?: string;
}) {
    return (
        <div>
            <span className="text-sm font-medium text-gray-800">Type</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
                {LEAVE_TYPE_PRIMARY_OPTIONS.map((option) => (
                    <TypeOption
                        key={option.value}
                        value={option.value}
                        label={option.label}
                        src={option.src}
                        selected={type === option.value}
                        onSelect={onTypeChange}
                    />
                ))}
                <TypeOption
                    value="other"
                    label={LEAVE_TYPE_LABELS.other}
                    selected={type === 'other'}
                    onSelect={onTypeChange}
                    spansFullWidth
                />
            </div>
            {error !== undefined ? (
                <p className="mt-1 text-xs text-red-600">{error}</p>
            ) : null}
        </div>
    );
}

function LeavePeriodFields({
    request,
    errors,
}: {
    request: LeaveRequestListItem | null;
    errors: Record<string, string>;
}) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
                <label htmlFor="leave-starts-on" className="text-sm font-medium text-gray-800">
                    Van <span className="text-red-600">*</span>
                </label>
                <input
                    id="leave-starts-on"
                    name="starts_on"
                    type="date"
                    required
                    defaultValue={request?.starts_on ?? ''}
                    className={inputClass}
                />
                {errors.starts_on !== undefined ? (
                    <p className="mt-1 text-xs text-red-600">{errors.starts_on}</p>
                ) : null}
            </div>
            <div>
                <label htmlFor="leave-ends-on" className="text-sm font-medium text-gray-800">
                    Tot en met <span className="text-red-600">*</span>
                </label>
                <input
                    id="leave-ends-on"
                    name="ends_on"
                    type="date"
                    required
                    defaultValue={request?.ends_on ?? ''}
                    className={inputClass}
                />
                {errors.ends_on !== undefined ? (
                    <p className="mt-1 text-xs text-red-600">{errors.ends_on}</p>
                ) : null}
            </div>
        </div>
    );
}

function LeaveExtraFields({
    type,
    isEdit,
    request,
    errors,
}: {
    type: LeaveType;
    isEdit: boolean;
    request: LeaveRequestListItem | null;
    errors: Record<string, string>;
}) {
    return (
        <>
            <div>
                <label htmlFor="leave-notes" className="text-sm font-medium text-gray-800">
                    Opmerking
                </label>
                <textarea
                    id="leave-notes"
                    name="notes"
                    rows={3}
                    defaultValue={request?.notes ?? ''}
                    placeholder="Optioneel: extra toelichting voor je beheerder"
                    className={inputClass}
                />
                {errors.notes !== undefined ? (
                    <p className="mt-1 text-xs text-red-600">{errors.notes}</p>
                ) : null}
            </div>

            {type === 'sick' ? (
                <div>
                    <label
                        htmlFor="leave-medical-certificate"
                        className="text-sm font-medium text-gray-800"
                    >
                        Doktersbrief{' '}
                        {isEdit && request?.attachment !== null ? null : (
                            <span className="text-red-600">*</span>
                        )}
                    </label>
                    {isEdit && request !== null && request.attachment !== null ? (
                        <p className="mt-1 text-xs text-gray-500">
                            Huidig bestand:{' '}
                            <a
                                href={request.attachment.url}
                                className="font-medium text-gray-700 underline hover:text-gray-900"
                            >
                                {request.attachment.name}
                            </a>
                            . Upload een nieuw bestand om te vervangen.
                        </p>
                    ) : (
                        <p className="mt-1 text-xs text-gray-500">
                            PDF, JPG of PNG, max. 5 MB.
                        </p>
                    )}
                    <input
                        id="leave-medical-certificate"
                        name="medical_certificate"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        required={!isEdit || request?.attachment === null}
                        className={cn(
                            inputClass,
                            'file:me-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-700',
                        )}
                    />
                    {errors.medical_certificate !== undefined ? (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.medical_certificate}
                        </p>
                    ) : null}
                </div>
            ) : null}
        </>
    );
}

export function LeaveRequestFormPanel({
    onClose,
    onSuccess,
    request = null,
}: LeaveRequestFormPanelProps) {
    const titleId = useId();
    const isEdit = request !== null;
    const [step, setStep] = useState(0);
    const [type, setType] = useState<LeaveType>(request?.type ?? 'vacation');
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

    const formProps = isEdit
        ? update.form.patch({ leave_request: request.id })
        : store.form.post();

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
                            {isEdit ? 'Verlofaanvraag bewerken' : 'Nieuwe verlofaanvraag'}
                        </h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {isEdit
                                ? 'Pas type en periode aan zolang de aanvraag in behandeling is.'
                                : 'Doorloop de stappen om je aanvraag in te dienen.'}
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
                        encType="multipart/form-data"
                        noValidate
                        options={{ preserveScroll: true }}
                        onKeyDown={(event) => handleWizardFormKeyDown(event, wizardHandlers)}
                        onSuccess={() => {
                            onSuccess(
                                isEdit
                                    ? 'Verlofaanvraag bijgewerkt.'
                                    : 'Verlofaanvraag ingediend.',
                            );
                            onClose();
                        }}
                        className="space-y-5 px-5 py-5 sm:px-6"
                    >
                        {({ errors, processing, submit }) => (
                            <>
                                <FormStepIndicator steps={STEPS} currentStep={step} />

                                <FormStepPanel step={0} currentStep={step}>
                                    <LeaveTypeFields
                                        type={type}
                                        onTypeChange={setType}
                                        error={errors.type}
                                    />
                                </FormStepPanel>

                                <FormStepPanel step={1} currentStep={step}>
                                    <LeavePeriodFields
                                        request={request}
                                        errors={errors}
                                    />
                                </FormStepPanel>

                                <FormStepPanel step={2} currentStep={step}>
                                    <LeaveExtraFields
                                        type={type}
                                        isEdit={isEdit}
                                        request={request}
                                        errors={errors}
                                    />
                                </FormStepPanel>

                                <FormStepFooter
                                    currentStep={step}
                                    totalSteps={STEPS.length}
                                    processing={processing}
                                    submitLabel={isEdit ? 'Opslaan' : 'Indienen'}
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
