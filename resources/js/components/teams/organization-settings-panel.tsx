import { Form } from '@inertiajs/react';
import { useEffect, useId, useRef } from 'react';

import { cn } from '@/lib/utils';
import { store as sendOrganizationInvite } from '@/routes/teams/organization-invites';
import { update as updateOrganization } from '@/routes/teams/organization';
import type { OrganizationSummary } from '@/types/teams';

type OrganizationSettingsPanelProps = {
    organization: OrganizationSummary;
    onSuccess: (message: string) => void;
    mode?: 'dialog' | 'featured';
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

const inputClass =
    'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10';

const primaryButtonClass =
    'rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60';

function IconBuilding({ className }: { className?: string }) {
    return (
        <svg className={className} width={18} height={18} viewBox="0 0 24 24" aria-hidden fill="none">
            <path
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"
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

function OrganizationSettingsBody({
    organization,
    onSuccess,
    onClose,
    variant,
}: {
    organization: OrganizationSummary;
    onSuccess: (message: string) => void;
    onClose?: () => void;
    variant: 'dialog' | 'featured';
}) {
    const nameFormId = useId();
    const inviteFormId = useId();

    return (
        <div className={cn('space-y-8', variant === 'featured' && 'sm:space-y-10')}>
            <Form
                key={`organization-${organization.id}`}
                {...updateOrganization.form.patch({ organization: organization.id })}
                options={{ preserveScroll: true }}
                onSuccess={() => {
                    onSuccess('Organisatie opgeslagen.');
                }}
                className="space-y-4"
            >
                {({ errors, processing }) => (
                    <>
                        <div>
                            <label
                                htmlFor={`${nameFormId}-organization-name`}
                                className="text-sm font-medium text-gray-800"
                            >
                                Bedrijfsnaam
                            </label>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Zichtbaar voor iedereen in je organisatie.
                            </p>
                            <input
                                id={`${nameFormId}-organization-name`}
                                type="text"
                                name="name"
                                required
                                defaultValue={organization.name}
                                className={inputClass}
                            />
                            {errors.name !== undefined ? (
                                <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>
                            ) : null}
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={processing} className={primaryButtonClass}>
                                {processing ? 'Opslaan…' : 'Naam opslaan'}
                            </button>
                        </div>
                    </>
                )}
            </Form>

            <div className="border-t border-gray-200 pt-8">
                <Form
                    {...sendOrganizationInvite.form.post()}
                    options={{ preserveScroll: true }}
                    onSuccess={() => {
                        onSuccess('Uitnodiging verstuurd.');
                    }}
                    className="space-y-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <div>
                                <label
                                    htmlFor={`${inviteFormId}-invite-email`}
                                    className="text-sm font-medium text-gray-800"
                                >
                                    Medewerker uitnodigen
                                </label>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    Stuur een uitnodiging per e-mail. De link is 7 dagen geldig.
                                </p>
                                <input
                                    id={`${inviteFormId}-invite-email`}
                                    type="email"
                                    name="email"
                                    required
                                    autoComplete="email"
                                    placeholder="naam@voorbeeld.nl"
                                    className={inputClass}
                                />
                                {errors.email !== undefined ? (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>
                                ) : null}
                            </div>
                            <div
                                className={cn(
                                    'flex gap-2',
                                    variant === 'dialog'
                                        ? 'flex-col-reverse border-t border-gray-200 pt-4 sm:flex-row sm:justify-end'
                                        : 'justify-end',
                                )}
                            >
                                {variant === 'dialog' && onClose !== undefined ? (
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={processing}
                                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                                    >
                                        Sluiten
                                    </button>
                                ) : null}
                                <button type="submit" disabled={processing} className={primaryButtonClass}>
                                    {processing ? 'Bezig…' : 'Uitnodiging versturen'}
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </div>
    );
}

export function OrganizationSettingsPanel({
    organization,
    onSuccess,
    open = false,
    onOpenChange,
    mode = 'dialog',
}: OrganizationSettingsPanelProps) {
    const titleId = useId();
    const panelRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!open || mode !== 'dialog' || onOpenChange === undefined) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onOpenChange(false);
            }
        }

        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [open, mode, onOpenChange]);

    if (mode === 'featured') {
        return (
            <section
                className="mx-auto mb-10 max-w-2xl rounded-xl border border-gray-200 bg-white p-6 text-start shadow-sm sm:p-8"
                aria-labelledby={titleId}
            >
                <div className="flex items-start gap-3 border-b border-gray-200 pb-6">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                        <IconBuilding />
                    </span>
                    <div>
                        <h2 id={titleId} className="text-base font-semibold text-gray-900">
                            Organisatie instellen
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-gray-500">
                            Pas je bedrijfsnaam aan en nodig collega&apos;s uit voordat je teams aanmaakt.
                        </p>
                    </div>
                </div>
                <div className="pt-8">
                    <OrganizationSettingsBody
                        organization={organization}
                        onSuccess={onSuccess}
                        variant="featured"
                    />
                </div>
            </section>
        );
    }

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[9990] flex items-end justify-center bg-gray-900/40 p-3 sm:items-center sm:p-4"
            role="presentation"
            onClick={() => onOpenChange?.(false)}
        >
            <section
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl sm:rounded-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                            <IconBuilding />
                        </span>
                        <div>
                            <h2 id={titleId} className="text-base font-semibold text-gray-900">
                                Organisatie
                            </h2>
                            <p className="mt-0.5 text-sm text-gray-500">
                                Bedrijfsnaam en uitnodigingen.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onOpenChange?.(false)}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                        aria-label="Sluiten"
                    >
                        <IconClose />
                    </button>
                </div>

                <div className="px-5 py-6 sm:px-6">
                    <OrganizationSettingsBody
                        organization={organization}
                        onSuccess={onSuccess}
                        onClose={() => onOpenChange?.(false)}
                        variant="dialog"
                    />
                </div>
            </section>
        </div>
    );
}

type OrganizationSettingsTriggerProps = {
    onClick: () => void;
};

export function OrganizationSettingsTrigger({ onClick }: OrganizationSettingsTriggerProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
        >
            <IconBuilding />
            Organisatie
        </button>
    );
}
