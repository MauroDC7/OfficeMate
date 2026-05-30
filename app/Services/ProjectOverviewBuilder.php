<?php

namespace App\Services;

use App\Enums\TeamMembershipStatus;
use App\Models\Organization;
use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\TimesheetEntry;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

final class ProjectOverviewBuilder
{
    private const MEMBER_PREVIEW_LIMIT = 4;

    /**
     * @return list<array{
     *     id: int,
     *     name: string,
     *     type: string,
     *     status: string,
     *     client_name: string|null,
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
     * @return array{
     *     id: int,
     *     name: string,
     *     type: string,
     *     status: string,
     *     client_name: string|null,
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
