import { useEffect } from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode, RefObject } from 'react';

import { cn } from '@/lib/utils';

export function validateFormStep(
    form: HTMLFormElement,
    stepIndex: number,
): boolean {
    const step = form.querySelector<HTMLElement>(
        `[data-form-step="${stepIndex}"]`,
    );

    if (step === null) {
        return true;
    }

    const fields = step.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
    );

    for (const field of fields) {
        if (!field.checkValidity()) {
            field.reportValidity();

            return false;
        }
    }

    return true;
}

export function findFirstInvalidFormStep(
    form: HTMLFormElement,
    totalSteps: number,
): number | null {
    for (let index = 0; index < totalSteps; index += 1) {
        if (!validateFormStep(form, index)) {
            return index;
        }
    }

    return null;
}

export function advanceFormStep(
    currentStep: number,
    totalSteps: number,
): number {
    return Math.min(currentStep + 1, totalSteps - 1);
}

type WizardFormHandlersOptions = {
    currentStep: number;
    totalSteps: number;
    setStep: (step: number) => void;
};

export function tryAdvanceFormStep(
    form: HTMLFormElement,
    options: WizardFormHandlersOptions,
): boolean {
    if (!validateFormStep(form, options.currentStep)) {
        return false;
    }

    options.setStep(
        advanceFormStep(options.currentStep, options.totalSteps),
    );

    return true;
}

export function submitWizardForm(
    form: HTMLFormElement,
    options: WizardFormHandlersOptions,
    submit: () => void,
): void {
    const invalidStep = findFirstInvalidFormStep(form, options.totalSteps);

    if (invalidStep !== null) {
        options.setStep(invalidStep);

        return;
    }

    submit();
}

export function useWizardFormSubmitGuard(
    containerRef: RefObject<HTMLElement | null>,
    enabled: boolean,
    currentStep: number,
    totalSteps: number,
    setStep: (step: number) => void,
): void {
    useEffect(() => {
        if (!enabled) {
            return;
        }

        const container = containerRef.current;

        if (container === null) {
            return;
        }

        const form = container.querySelector('form');

        if (!(form instanceof HTMLFormElement)) {
            return;
        }

        const options: WizardFormHandlersOptions = {
            currentStep,
            totalSteps,
            setStep,
        };

        function onCaptureSubmit(event: Event): void {
            if (options.currentStep < options.totalSteps - 1) {
                event.preventDefault();
                event.stopImmediatePropagation();
                tryAdvanceFormStep(form, options);

                return;
            }

            const invalidStep = findFirstInvalidFormStep(
                form,
                options.totalSteps,
            );

            if (invalidStep !== null) {
                event.preventDefault();
                event.stopImmediatePropagation();
                options.setStep(invalidStep);
            }
        }

        form.addEventListener('submit', onCaptureSubmit, true);

        return () => {
            form.removeEventListener('submit', onCaptureSubmit, true);
        };
    }, [containerRef, enabled, currentStep, totalSteps, setStep]);
}

export function handleWizardFormKeyDown(
    event: KeyboardEvent<HTMLFormElement>,
    options: WizardFormHandlersOptions,
): void {
    if (event.key !== 'Enter') {
        return;
    }

    const target = event.target;

    if (
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLButtonElement ||
        target instanceof HTMLSelectElement
    ) {
        return;
    }

    event.preventDefault();

    const form = event.currentTarget;

    if (options.currentStep < options.totalSteps - 1) {
        tryAdvanceFormStep(form, options);

        return;
    }

    const invalidStep = findFirstInvalidFormStep(form, options.totalSteps);

    if (invalidStep !== null) {
        options.setStep(invalidStep);

        return;
    }

    submitWizardForm(form, options, () => {
        form.requestSubmit();
    });
}

type FormStepIndicatorProps = {
    steps: readonly string[];
    currentStep: number;
};

export function FormStepIndicator({
    steps,
    currentStep,
}: FormStepIndicatorProps) {
    return (
        <nav
            aria-label="Formulierstappen"
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
            {steps.map((label, index) => (
                <span
                    key={label}
                    className={cn(
                        'rounded-md px-2 py-1.5 text-center text-xs font-medium',
                        index === currentStep
                            ? 'bg-gray-900 text-white'
                            : index < currentStep
                              ? 'bg-gray-200 text-gray-700'
                              : 'bg-gray-100 text-gray-400',
                    )}
                    aria-current={index === currentStep ? 'step' : undefined}
                >
                    {label}
                </span>
            ))}
        </nav>
    );
}

type FormStepPanelProps = {
    step: number;
    currentStep: number;
    children: ReactNode;
};

export function FormStepPanel({
    step,
    currentStep,
    children,
}: FormStepPanelProps) {
    const active = currentStep === step;

    return (
        <div
            data-form-step={step}
            className={cn('space-y-5', !active && 'hidden')}
            hidden={!active}
        >
            {children}
        </div>
    );
}

type FormStepFooterProps = {
    currentStep: number;
    totalSteps: number;
    processing: boolean;
    onBack: () => void;
    onNext: (event: MouseEvent<HTMLButtonElement>) => void;
    onCancel: () => void;
    submitLabel: string;
    onFinalSubmit?: () => void;
};

export function FormStepFooter({
    currentStep,
    totalSteps,
    processing,
    onBack,
    onNext,
    onCancel,
    submitLabel,
    onFinalSubmit,
}: FormStepFooterProps) {
    const isFirst = currentStep === 0;
    const isLast = currentStep === totalSteps - 1;

    return (
        <div
            data-form-step-footer
            className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-between"
        >
            <button
                type="button"
                onClick={onCancel}
                disabled={processing}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
            >
                Annuleren
            </button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {!isFirst ? (
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={processing}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                    >
                        Terug
                    </button>
                ) : null}
                {isLast ? (
                    <button
                        type={onFinalSubmit !== undefined ? 'button' : 'submit'}
                        disabled={processing}
                        onClick={
                            onFinalSubmit !== undefined
                                ? onFinalSubmit
                                : undefined
                        }
                        className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? 'Bezig…' : submitLabel}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={(event) => onNext(event)}
                        disabled={processing}
                        className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60"
                    >
                        Volgende
                    </button>
                )}
            </div>
        </div>
    );
}
