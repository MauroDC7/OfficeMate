import { Form } from '@inertiajs/react';
import { useEffect, useId, useRef } from 'react';

import { UserPicker } from '@/components/teams/user-picker';
import { cn } from '@/lib/utils';
import { store } from '@/routes/teams';
import type { OrganizationUserOption } from '@/types/teams';

type CreateTeamFormPanelProps = {
    open: boolean;
    onClose: () => void;
    organizationUsers: OrganizationUserOption[];
    selectedMemberIds: number[];
    onMemberIdsChange: (ids: number[]) => void;
    onSuccess: () => void;
};

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

export function CreateTeamFormPanel({
    open,
    onClose,
    organizationUsers,
    selectedMemberIds,
    onMemberIdsChange,
    onSuccess,
}: CreateTeamFormPanelProps) {
    const titleId = useId();
    const panelRef = useRef<HTMLElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

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

    if (!open) {
        return null;
    }

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
                            <IconPlus className="size-[18px]" />
                        </span>
                        <div>
                            <h2 id={titleId} className="text-base font-semibold text-gray-900">
                                Team toevoegen
                            </h2>
                            <p className="mt-0.5 text-sm text-gray-500">
                                Maak een team aan en voeg collega&apos;s toe.
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

                <Form
                    {...store.form.post()}
                    options={{
                        onSuccess: () => {
                            onMemberIdsChange([]);
                            onSuccess();
                            onClose();
                        },
                    }}
                    className="space-y-5 px-5 py-5 sm:px-6"
                >
                    {({ errors, processing }) => (
                        <>
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
                                        placeholder="bijv. Logistiek A"
                                        className={inputClass}
                                    />
                                    {errors.name ? (
                                        <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                                    ) : null}
                                </div>

                                <div className="sm:col-span-2">
                                    <label
                                        htmlFor="team-department"
                                        className="text-sm font-medium text-gray-800"
                                    >
                                        Afdeling
                                    </label>
                                    <input
                                        id="team-department"
                                        name="department"
                                        placeholder="bijv. Operationeel"
                                        className={inputClass}
                                    />
                                    {errors.department ? (
                                        <p className="mt-1 text-xs text-red-600">{errors.department}</p>
                                    ) : null}
                                </div>
                            </div>

                            <UserPicker
                                users={organizationUsers}
                                selectedIds={selectedMemberIds}
                                onChange={onMemberIdsChange}
                                disabled={processing}
                            />
                            {errors['member_ids.0'] ?? errors.member_ids ? (
                                <p className="-mt-3 text-xs text-red-600">
                                    {errors['member_ids.0'] ?? errors.member_ids}
                                </p>
                            ) : null}

                            <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={processing}
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                                >
                                    Annuleren
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Team opslaan
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            </section>
        </div>
    );
}
