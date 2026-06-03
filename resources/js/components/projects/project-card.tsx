import { router } from '@inertiajs/react';

import { useAlert } from '@/components/alert';
import {
    PROJECT_STATUS_BADGE,
    PROJECT_STATUS_LABELS,
    formatTrackedHours,
} from '@/components/projects/project-helpers';
import { MemberAvatarStack } from '@/components/teams/user-picker';
import { cn } from '@/lib/utils';
import { destroy as destroyProject } from '@/routes/projects';
import type { ProjectCard as ProjectCardType } from '@/types/projects';

type ProjectCardProps = {
    project: ProjectCardType;
    isAdmin: boolean;
    onEdit?: (project: ProjectCardType) => void;
    onDeleted?: () => void;
};

const TEAM_PREVIEW_LIMIT = 3;

export function ProjectCard({ project, isAdmin, onEdit, onDeleted }: ProjectCardProps) {
    const { confirm } = useAlert();

    const isExternal = project.type === 'external';
    const eyebrow = isExternal
        ? `Klant · ${project.client_name?.trim() || 'Onbekend'}`
        : 'Intern project';

    const trackedHours = formatTrackedHours(project.tracked_minutes);
    const hasBudget = project.hours_budget !== null && project.hours_budget > 0;
    const budgetPercent = hasBudget
        ? Math.min(100, Math.round((project.tracked_minutes / 60 / project.hours_budget!) * 100))
        : 0;
    const overBudget = hasBudget && project.tracked_minutes / 60 > project.hours_budget!;

    const visibleTeams = project.teams.slice(0, TEAM_PREVIEW_LIMIT);
    const extraTeams = Math.max(0, project.teams.length - visibleTeams.length);

    return (
        <article className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <span className="truncate text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                    {eyebrow}
                </span>
                <span
                    className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        PROJECT_STATUS_BADGE[project.status],
                    )}
                >
                    {PROJECT_STATUS_LABELS[project.status]}
                </span>
            </div>

            <div className="mt-3 flex items-start gap-3">
                {project.logo !== null ? (
                    <img
                        src={project.logo}
                        alt=""
                        className="size-12 shrink-0 rounded-lg border border-gray-200 object-cover"
                    />
                ) : (
                    <div
                        className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-sm font-semibold text-gray-500"
                        aria-hidden
                    >
                        {project.name.trim().charAt(0).toUpperCase() || '?'}
                    </div>
                )}
                <h3 className="min-w-0 flex-1 text-lg font-semibold tracking-tight text-gray-900">
                    {project.name}
                </h3>
            </div>

            <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-500">Uren budget</span>
                    <span className="font-semibold text-gray-900">
                        {trackedHours}
                        {hasBudget ? (
                            <span className="font-normal text-gray-400">
                                {' / '}
                                {project.hours_budget}u
                            </span>
                        ) : (
                            <span className="font-normal text-gray-400"> getrackt</span>
                        )}
                    </span>
                </div>
                {hasBudget ? (
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all',
                                overBudget ? 'bg-red-500' : 'bg-gray-900',
                            )}
                            style={{ width: `${budgetPercent}%` }}
                        />
                    </div>
                ) : null}
            </div>

            {project.teams.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                    {visibleTeams.map((team) => (
                        <li
                            key={team.id}
                            className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700"
                        >
                            {team.name}
                        </li>
                    ))}
                    {extraTeams > 0 ? (
                        <li className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                            +{extraTeams}
                        </li>
                    ) : null}
                </ul>
            ) : (
                <p className="mt-4 text-xs text-gray-400">Nog geen team gekoppeld</p>
            )}

            <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                <MemberAvatarStack
                    members={project.members_preview}
                    memberCount={project.member_count}
                />
                <div className="text-end">
                    <p className="text-[10px] font-medium tracking-wide text-gray-400 uppercase">
                        Getrackt
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{trackedHours}</p>
                </div>
            </div>

            {isAdmin ? (
                <div className="mt-4 flex items-center justify-end gap-1 border-t border-gray-100 pt-3">
                    <button
                        type="button"
                        onClick={() => onEdit?.(project)}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                    >
                        Bewerken
                    </button>
                    <button
                        type="button"
                        onClick={async () => {
                            const accepted = await confirm({
                                message: `Project “${project.name}” verwijderen?`,
                                confirmLabel: 'Verwijderen',
                                variant: 'danger',
                            });

                            if (!accepted) {
                                return;
                            }

                            router.delete(destroyProject.url({ project: project.id }), {
                                onSuccess: onDeleted,
                            });
                        }}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-500 transition hover:bg-red-50 hover:text-red-700"
                    >
                        Verwijderen
                    </button>
                </div>
            ) : null}
        </article>
    );
}
