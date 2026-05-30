import { router } from '@inertiajs/react';
import { useEffect, useId } from 'react';

import { UserAvatar } from '@/components/user-avatar';
import { getUserDisplayFullName } from '@/lib/user-display';
import { cn } from '@/lib/utils';
import { update as updateCreatorAccess } from '@/routes/projects/creator-access';
import type { ProjectCreatorOption } from '@/types/projects';

type ProjectAccessPanelProps = {
    onClose: () => void;
    users: ProjectCreatorOption[];
    onSuccess: (message: string) => void;
};

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

export function ProjectAccessPanel({ onClose, users, onSuccess }: ProjectAccessPanelProps) {
    const titleId = useId();

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

    function toggle(user: ProjectCreatorOption) {
        const next = !user.can_create_projects;

        router.patch(
            updateCreatorAccess.url({ user: user.id }),
            { can_create_projects: next },
            {
                preserveScroll: true,
                onSuccess: () =>
                    onSuccess(
                        next
                            ? `${getUserDisplayFullName(user)} mag nu projecten aanmaken.`
                            : `Recht ingetrokken voor ${getUserDisplayFullName(user)}.`,
                    ),
            },
        );
    }

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
                            Projectrechten beheren
                        </h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            Geef collega&apos;s toestemming om zelf projecten aan te maken.
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

                <div className="px-5 py-5 sm:px-6">
                    {users.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            Er zijn nog geen collega&apos;s in je organisatie.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {users.map((user) => (
                                <li
                                    key={user.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <UserAvatar user={user} className="size-9" textClassName="text-xs" />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-900">
                                                {getUserDisplayFullName(user)}
                                            </p>
                                            <p className="truncate text-xs text-gray-500">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={user.can_create_projects}
                                        onClick={() => toggle(user)}
                                        className={cn(
                                            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition',
                                            user.can_create_projects ? 'bg-gray-900' : 'bg-gray-200',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'inline-block size-4 transform rounded-full bg-white shadow transition',
                                                user.can_create_projects
                                                    ? 'translate-x-6'
                                                    : 'translate-x-1',
                                            )}
                                        />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    );
}
