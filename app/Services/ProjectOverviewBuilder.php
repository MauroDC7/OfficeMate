<?php

namespace App\Services;

use App\Enums\TeamMembershipStatus;
use App\Models\Organization;
use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\TimesheetEntry;
use App\Models\TimesheetEntryProposal;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

final class ProjectOverviewBuilder
{
    private const MEMBER_PREVIEW_LIMIT = 4;

    private const RECENT_ENTRIES_LIMIT = 15;

    private const PENDING_PROPOSALS_LIMIT = 10;

    /**
     * @return list<array{
     *     id: int,
     *     name: string,
     *     type: string,
     *     status: string,
     *     client_name: string|null,
     *     logo: string|null,
     *     hours_budget: int|null,
     *     tracked_minutes: int,
     *     member_count: int,
     *     members_preview: list<array{id: int, name: string, email: string, first_name: string, last_name: string, avatar: string|null}>,
     *     teams: list<array{id: int, name: string, department: string|null}>
     * }>
     */
    public function cardsFor(Organization $organization, User $viewer, bool $isAdmin): array
    {
        $projects = $this->projectsQuery($organization, $viewer, $isAdmin)
            ->with([
                'teams' => fn ($query) => $query
                    ->orderBy('name')
                    ->with([
                        'memberships' => fn ($membershipQuery) => $membershipQuery
                            ->where('status', TeamMembershipStatus::Approved)
                            ->with('user:id,first_name,last_name,email,avatar_path'),
                    ]),
            ])
            ->orderBy('name')
            ->get();

        $trackedMinutes = $this->trackedMinutesByProject($projects->pluck('id')->all());

        return $projects
            ->map(fn (Project $project): array => $this->cardPayload(
                $project,
                $trackedMinutes[$project->id] ?? 0,
            ))
            ->all();
    }

    /**
     * @return array{total_projects: int, tracked_hours_month: int, budget_utilization: int}
     */
    public function statsFor(Organization $organization, User $viewer, bool $isAdmin): array
    {
        $projects = $this->projectsQuery($organization, $viewer, $isAdmin)->get(['id', 'hours_budget']);
        $projectIds = $projects->pluck('id')->all();

        $trackedTotal = array_sum($this->trackedMinutesByProject($projectIds));
        $trackedMonth = array_sum($this->trackedMinutesByProject($projectIds, $this->startOfMonth()));
        $budgetMinutes = (int) $projects->sum(fn (Project $project): int => (int) $project->hours_budget * 60);

        return [
            'total_projects' => count($projectIds),
            'tracked_hours_month' => intdiv($trackedMonth, 60),
            'budget_utilization' => $budgetMinutes > 0
                ? (int) round($trackedTotal / $budgetMinutes * 100)
                : 0,
        ];
    }

    /**
     * @return list<array{id: int, name: string, type: string, client_name: string|null}>
     */
    public function selectableOptionsFor(Organization $organization, User $viewer, bool $isAdmin): array
    {
        return $this->projectsQuery($organization, $viewer, $isAdmin)
            ->active()
            ->orderBy('name')
            ->get(['id', 'name', 'type', 'client_name'])
            ->map(fn (Project $project): array => [
                'id' => $project->id,
                'name' => $project->name,
                'type' => $project->type->value,
                'client_name' => $project->client_name,
            ])
            ->all();
    }

    public function findAccessible(
        Organization $organization,
        User $viewer,
        bool $isAdmin,
        int $projectId,
    ): ?Project {
        return $this->projectsQuery($organization, $viewer, $isAdmin)
            ->whereKey($projectId)
            ->first();
    }

    /**
     * @return array{
     *     project: array{
     *         id: int,
     *         name: string,
     *         type: string,
     *         status: string,
     *         client_name: string|null,
     *         logo: string|null,
     *         hours_budget: int|null,
     *         is_active: bool,
     *         created_at: string|null,
     *         creator: array{id: int, name: string}|null,
     *     },
     *     teams: list<array{id: int, name: string, department: string|null}>,
     *     members: list<array{id: int, name: string, email: string, first_name: string, last_name: string, avatar: string|null}>,
     *     hours: array{
     *         tracked_minutes_total: int,
     *         tracked_minutes_week: int,
     *         tracked_minutes_month: int,
     *     },
     *     hours_by_member: list<array{
     *         user: array{id: int, name: string, avatar: string|null},
     *         tracked_minutes: int,
     *     }>,
     *     recent_entries: list<array{
     *         id: int,
     *         title: string,
     *         worked_on: string,
     *         start_minutes: int,
     *         end_minutes: int,
     *         duration_minutes: int,
     *         user: array{id: int, name: string}|null,
     *     }>,
     *     pending_proposals: list<array{
     *         id: int,
     *         title: string,
     *         worked_on: string,
     *         start_minutes: int,
     *         end_minutes: int,
     *         user: array{id: int, name: string},
     *     }>,
     *     isAdmin: bool,
     *     canUpdate: bool,
     * }
     */
    public function cardFor(Project $project): array
    {
        $project->load([
            'teams' => fn ($query) => $query
                ->orderBy('name')
                ->with([
                    'memberships' => fn ($membershipQuery) => $membershipQuery
                        ->where('status', TeamMembershipStatus::Approved)
                        ->with('user:id,first_name,last_name,email,avatar_path'),
                ]),
        ]);

        return $this->cardPayload(
            $project,
            $this->trackedMinutesForProject($project->id),
        );
    }

    public function showPageFor(Project $project, User $viewer, bool $isAdmin): array
    {
        $project->load([
            'creator:id,first_name,last_name',
            'teams' => fn ($query) => $query
                ->orderBy('name')
                ->with([
                    'memberships' => fn ($membershipQuery) => $membershipQuery
                        ->where('status', TeamMembershipStatus::Approved)
                        ->with('user:id,first_name,last_name,email,avatar_path')
                        ->orderBy('id'),
                ]),
        ]);

        $members = $this->membersForProject($project);
        $scopedUserId = $isAdmin ? null : $viewer->id;

        $trackedTotal = $this->trackedMinutesForProject($project->id, null, $scopedUserId);
        $trackedWeek = $this->trackedMinutesForProject(
            $project->id,
            CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY),
            $scopedUserId,
        );
        $trackedMonth = $this->trackedMinutesForProject($project->id, $this->startOfMonth(), $scopedUserId);

        return [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'type' => $project->type->value,
                'status' => $project->status->value,
                'client_name' => $project->client_name,
                'logo' => $project->logo,
                'hours_budget' => $project->hours_budget,
                'is_active' => $project->is_active,
                'created_at' => $project->created_at?->toIso8601String(),
                'creator' => $project->creator === null
                    ? null
                    : [
                        'id' => $project->creator->id,
                        'name' => $project->creator->name,
                    ],
            ],
            'teams' => $project->teams
                ->map(fn (Team $team): array => [
                    'id' => $team->id,
                    'name' => $team->name,
                    'department' => $team->department,
                ])
                ->all(),
            'members' => $members
                ->map(fn (User $user): array => $this->userPayload($user))
                ->all(),
            'hours' => [
                'tracked_minutes_total' => $trackedTotal,
                'tracked_minutes_week' => $trackedWeek,
                'tracked_minutes_month' => $trackedMonth,
            ],
            'hours_by_member' => $this->hoursByMemberForProject($project->id, $isAdmin ? null : $viewer->id),
            'recent_entries' => $this->recentEntriesForProject($project->id, $isAdmin ? null : $viewer->id),
            'pending_proposals' => $isAdmin
                ? $this->pendingProposalsForProject($project->id, $project->organization_id)
                : [],
            'isAdmin' => $isAdmin,
            'canUpdate' => $isAdmin,
        ];
    }

    /**
     * @return list<array{id: int, name: string, department: string|null}>
     */
    public function organizationTeams(Organization $organization): array
    {
        return Team::query()
            ->where('organization_id', $organization->id)
            ->orderBy('name')
            ->get(['id', 'name', 'department'])
            ->map(fn (Team $team): array => [
                'id' => $team->id,
                'name' => $team->name,
                'department' => $team->department,
            ])
            ->all();
    }

    /**
     * @return Builder<Project>
     */
    private function projectsQuery(Organization $organization, User $viewer, bool $isAdmin): Builder
    {
        $query = Project::query()->where('organization_id', $organization->id);

        if (! $isAdmin) {
            $query->where(function (Builder $scoped) use ($viewer): void {
                $scoped
                    ->where('created_by', $viewer->id)
                    ->orWhereHas('teams.memberships', fn (Builder $membershipQuery) => $membershipQuery
                        ->where('user_id', $viewer->id)
                        ->where('status', TeamMembershipStatus::Approved),
                    );
            });
        }

        return $query;
    }

    /**
     * @param  list<int>  $projectIds
     * @return array<int, int>
     */
    private function trackedMinutesByProject(array $projectIds, ?CarbonImmutable $since = null): array
    {
        if ($projectIds === []) {
            return [];
        }

        return TimesheetEntry::query()
            ->whereIn('project_id', $projectIds)
            ->when($since !== null, fn ($query) => $query->where('worked_on', '>=', $since->toDateString()))
            ->selectRaw('project_id, SUM(end_minutes - start_minutes) as minutes')
            ->groupBy('project_id')
            ->pluck('minutes', 'project_id')
            ->map(fn ($minutes): int => (int) $minutes)
            ->all();
    }

    private function startOfMonth(): CarbonImmutable
    {
        return CarbonImmutable::now()->startOfMonth();
    }

    /**
     * @return Collection<int, User>
     */
    private function membersForProject(Project $project): Collection
    {
        /** @var Collection<int, Team> $teams */
        $teams = $project->teams;

        return $teams
            ->flatMap(fn (Team $team): Collection => $team->memberships
                ->map(fn (TeamMembership $membership): User => $membership->user),
            )
            ->filter()
            ->unique('id')
            ->sortBy(fn (User $user): string => $user->name)
            ->values();
    }

    private function trackedMinutesForProject(
        int $projectId,
        ?CarbonImmutable $since = null,
        ?int $userId = null,
    ): int {
        return (int) TimesheetEntry::query()
            ->where('project_id', $projectId)
            ->when($since !== null, fn ($query) => $query->where('worked_on', '>=', $since->toDateString()))
            ->when($userId !== null, fn ($query) => $query->where('user_id', $userId))
            ->selectRaw('COALESCE(SUM(end_minutes - start_minutes), 0) as minutes')
            ->value('minutes');
    }

    /**
     * @return list<array{
     *     user: array{id: int, name: string, avatar: string|null},
     *     tracked_minutes: int,
     * }>
     */
    private function hoursByMemberForProject(int $projectId, ?int $onlyUserId): array
    {
        $rows = TimesheetEntry::query()
            ->where('project_id', $projectId)
            ->when($onlyUserId !== null, fn ($query) => $query->where('user_id', $onlyUserId))
            ->selectRaw('user_id, SUM(end_minutes - start_minutes) as tracked_minutes')
            ->groupBy('user_id')
            ->orderByDesc('tracked_minutes')
            ->get();

        $users = User::query()
            ->whereIn('id', $rows->pluck('user_id'))
            ->get(['id', 'first_name', 'last_name', 'avatar_path'])
            ->keyBy('id');

        return $rows
            ->map(function (TimesheetEntry $row) use ($users): ?array {
                $user = $users->get($row->user_id);

                if (! $user instanceof User) {
                    return null;
                }

                return [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'avatar' => $user->avatar,
                    ],
                    'tracked_minutes' => (int) $row->tracked_minutes,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return list<array{
     *     id: int,
     *     title: string,
     *     worked_on: string,
     *     start_minutes: int,
     *     end_minutes: int,
     *     duration_minutes: int,
     *     user: array{id: int, name: string}|null,
     * }>
     */
    private function recentEntriesForProject(int $projectId, ?int $onlyUserId): array
    {
        return TimesheetEntry::query()
            ->where('project_id', $projectId)
            ->when($onlyUserId !== null, fn ($query) => $query->where('user_id', $onlyUserId))
            ->with('user:id,first_name,last_name')
            ->orderByDesc('worked_on')
            ->orderByDesc('start_minutes')
            ->limit(self::RECENT_ENTRIES_LIMIT)
            ->get()
            ->map(fn (TimesheetEntry $entry): array => [
                'id' => $entry->id,
                'title' => $entry->title,
                'worked_on' => $entry->worked_on->format('Y-m-d'),
                'start_minutes' => $entry->start_minutes,
                'end_minutes' => $entry->end_minutes,
                'duration_minutes' => $entry->end_minutes - $entry->start_minutes,
                'user' => $entry->user === null
                    ? null
                    : [
                        'id' => $entry->user->id,
                        'name' => $entry->user->name,
                    ],
            ])
            ->all();
    }

    /**
     * @return list<array{
     *     id: int,
     *     title: string,
     *     worked_on: string,
     *     start_minutes: int,
     *     end_minutes: int,
     *     user: array{id: int, name: string},
     * }>
     */
    private function pendingProposalsForProject(int $projectId, int $organizationId): array
    {
        $memberIds = User::query()
            ->where('organization_id', $organizationId)
            ->pluck('id');

        return TimesheetEntryProposal::query()
            ->where('project_id', $projectId)
            ->whereIn('user_id', $memberIds)
            ->with('user:id,first_name,last_name')
            ->orderByDesc('worked_on')
            ->orderByDesc('start_minutes')
            ->limit(self::PENDING_PROPOSALS_LIMIT)
            ->get()
            ->map(fn (TimesheetEntryProposal $proposal): array => [
                'id' => $proposal->id,
                'title' => $proposal->title,
                'worked_on' => $proposal->worked_on->format('Y-m-d'),
                'start_minutes' => $proposal->start_minutes,
                'end_minutes' => $proposal->end_minutes,
                'user' => [
                    'id' => $proposal->user->id,
                    'name' => $proposal->user->name,
                ],
            ])
            ->all();
    }

    /**
     * @return array{
     *     id: int,
     *     name: string,
     *     type: string,
     *     status: string,
     *     client_name: string|null,
     *     logo: string|null,
     *     hours_budget: int|null,
     *     tracked_minutes: int,
     *     member_count: int,
     *     members_preview: list<array{id: int, name: string, email: string, first_name: string, last_name: string, avatar: string|null}>,
     *     teams: list<array{id: int, name: string, department: string|null}>
     * }
     */
    private function cardPayload(Project $project, int $trackedMinutes): array
    {
        /** @var Collection<int, Team> $teams */
        $teams = $project->teams;

        /** @var Collection<int, User> $members */
        $members = $teams
            ->flatMap(fn (Team $team): Collection => $team->memberships
                ->map(fn (TeamMembership $membership): User => $membership->user),
            )
            ->filter()
            ->unique('id')
            ->values();

        return [
            'id' => $project->id,
            'name' => $project->name,
            'type' => $project->type->value,
            'status' => $project->status->value,
            'client_name' => $project->client_name,
            'logo' => $project->logo,
            'hours_budget' => $project->hours_budget,
            'tracked_minutes' => $trackedMinutes,
            'member_count' => $members->count(),
            'members_preview' => $members
                ->take(self::MEMBER_PREVIEW_LIMIT)
                ->map(fn (User $user): array => $this->userPayload($user))
                ->all(),
            'teams' => $teams
                ->map(fn (Team $team): array => [
                    'id' => $team->id,
                    'name' => $team->name,
                    'department' => $team->department,
                ])
                ->all(),
        ];
    }

    /**
     * @return array{id: int, name: string, email: string, first_name: string, last_name: string, avatar: string|null}
     */
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'avatar' => $user->avatar,
        ];
    }
}
