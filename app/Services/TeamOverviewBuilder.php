<?php

namespace App\Services;

use App\Enums\TeamMembershipStatus;
use App\Models\Organization;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

final class TeamOverviewBuilder
{
    private const MEMBER_PREVIEW_LIMIT = 4;

    /**
     * @return list<array{
     *     id: int,
     *     name: string,
     *     department: string|null,
     *     member_count: int,
     *     members_preview: list<array{
     *         id: int,
     *         name: string,
     *         email: string,
     *         first_name: string,
     *         last_name: string,
     *         avatar: string|null
     *     }>,
     *     my_status: string|null,
     *     member_ids?: list<int>
     * }>
     */
    public function cardsFor(Organization $organization, User $viewer, bool $isAdmin): array
    {
        $teams = $this->teamsQuery($organization, $viewer, $isAdmin)
            ->with([
                'memberships' => fn ($query) => $query
                    ->where('status', TeamMembershipStatus::Approved)
                    ->with('user:id,first_name,last_name,email,avatar_path')
                    ->when(! $isAdmin, fn (Builder $membershipQuery) => $membershipQuery->limit(self::MEMBER_PREVIEW_LIMIT)),
            ])
            ->withCount([
                'memberships as member_count' => fn (Builder $query) => $query
                    ->where('status', TeamMembershipStatus::Approved),
            ])
            ->orderBy('name')
            ->get();

        $myStatuses = TeamMembership::query()
            ->where('user_id', $viewer->id)
            ->whereIn('team_id', $teams->pluck('id'))
            ->get()
            ->keyBy('team_id');

        return $teams
            ->map(fn (Team $team): array => $this->cardPayload($team, $myStatuses->get($team->id), $isAdmin))
            ->all();
    }

    /**
     * @return array{total_teams: int, total_members: int}
     */
    public function statsFor(Organization $organization, User $viewer, bool $isAdmin): array
    {
        $teamIds = $this->teamsQuery($organization, $viewer, $isAdmin)->pluck('id');

        $totalMembers = TeamMembership::query()
            ->whereIn('team_id', $teamIds)
            ->where('status', TeamMembershipStatus::Approved)
            ->distinct('user_id')
            ->count('user_id');

        return [
            'total_teams' => $teamIds->count(),
            'total_members' => $totalMembers,
        ];
    }

    /**
     * @return list<array{
     *     id: int,
     *     name: string,
     *     email: string,
     *     first_name: string,
     *     last_name: string,
     *     avatar: string|null
     * }>
     */
    public function organizationUsers(Organization $organization): array
    {
        return User::query()
            ->where('organization_id', $organization->id)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'email', 'avatar_path'])
            ->map(fn (User $user): array => $this->userPayload($user))
            ->all();
    }

    /**
     * @return Builder<Team>
     */
    private function teamsQuery(Organization $organization, User $viewer, bool $isAdmin): Builder
    {
        $query = Team::query()->where('organization_id', $organization->id);

        if (! $isAdmin) {
            $query->whereHas(
                'memberships',
                fn (Builder $membershipQuery) => $membershipQuery
                    ->where('user_id', $viewer->id)
                    ->where('status', TeamMembershipStatus::Approved),
            );
        }

        return $query;
    }

    /**
     * @return array{
     *     id: int,
     *     name: string,
     *     department: string|null,
     *     member_count: int,
     *     members_preview: list<array{
     *         id: int,
     *         name: string,
     *         email: string,
     *         first_name: string,
     *         last_name: string,
     *         avatar: string|null
     *     }>,
     *     my_status: string|null,
     *     member_ids?: list<int>
     * }
     */
    private function cardPayload(Team $team, ?TeamMembership $myMembership, bool $isAdmin): array
    {
        /** @var Collection<int, TeamMembership> $memberships */
        $memberships = $team->memberships;

        $payload = [
            'id' => $team->id,
            'name' => $team->name,
            'department' => $team->department,
            'member_count' => (int) $team->member_count,
            'members_preview' => $memberships
                ->take(self::MEMBER_PREVIEW_LIMIT)
                ->map(fn (TeamMembership $membership): array => $this->userPayload($membership->user))
                ->values()
                ->all(),
            'my_status' => $myMembership?->status->value,
        ];

        if ($isAdmin) {
            $payload['member_ids'] = $memberships
                ->pluck('user_id')
                ->map(fn (mixed $id): int => (int) $id)
                ->values()
                ->all();
        }

        return $payload;
    }

    /**
     * @return array{
     *     id: int,
     *     name: string,
     *     email: string,
     *     first_name: string,
     *     last_name: string,
     *     avatar: string|null
     * }
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
