<?php

namespace App\Http\Controllers;

use App\Enums\TeamMembershipStatus;
use App\Enums\UserRole;
use App\Http\Requests\Teams\StoreTeamRequest;
use App\Http\Requests\Teams\UpdateTeamRequest;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\User;
use App\Services\OrganizationContext;
use App\Services\OrganizationPresenceOverview;
use App\Services\TeamOverviewBuilder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class TeamController extends Controller
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
        private readonly TeamOverviewBuilder $teamOverviewBuilder,
        private readonly OrganizationPresenceOverview $organizationPresenceOverview,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $organization = $this->organizationContext->forUser($user);
        $isAdmin = $user->role === UserRole::Admin;

        if ($organization === null) {
            return Inertia::render('teams', [
                'organization' => null,
                'teamCards' => [],
                'stats' => ['total_teams' => 0, 'total_members' => 0],
                'organizationUsers' => [],
                'pendingMemberships' => [],
                'isAdmin' => $isAdmin,
                'awaitingOrganizationInvite' => $user->role !== UserRole::Admin && $user->organization_id === null,
                'people' => null,
                'initialTab' => 'teams',
            ]);
        }

        $pendingForApproval = $isAdmin
            ? TeamMembership::query()
                ->with(['team:id,name', 'user:id,first_name,last_name,email'])
                ->where('status', TeamMembershipStatus::Pending)
                ->whereHas(
                    'team',
                    fn ($query) => $query->where('organization_id', $organization->id),
                )
                ->orderBy('created_at')
                ->get()
                ->map(fn (TeamMembership $membership): array => $this->pendingPayload($membership))
                ->all()
            : [];

        return Inertia::render('teams', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
            ],
            'teamCards' => $this->teamOverviewBuilder->cardsFor($organization, $user, $isAdmin),
            'stats' => $this->teamOverviewBuilder->statsFor($organization, $user, $isAdmin),
            'organizationUsers' => $isAdmin
                ? $this->teamOverviewBuilder->organizationUsers($organization)
                : [],
            'pendingMemberships' => $pendingForApproval,
            'isAdmin' => $isAdmin,
            'awaitingOrganizationInvite' => false,
            'people' => $isAdmin
                ? $this->organizationPresenceOverview->forOrganization($organization)
                : null,
            'initialTab' => in_array($request->query('tab'), ['people', 'presence'], true) ? 'people' : 'teams',
        ]);
    }

    public function store(StoreTeamRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($user);
        $memberIds = collect($request->validated('member_ids') ?? [])
            ->map(fn (mixed $id): int => (int) $id)
            ->unique()
            ->values();

        DB::transaction(function () use ($organization, $request, $memberIds): void {
            $team = Team::query()->create([
                'organization_id' => $organization->id,
                'name' => $request->validated('name'),
                'department' => $request->validated('department'),
                'parent_id' => null,
            ]);

            foreach ($memberIds as $memberId) {
                TeamMembership::query()->create([
                    'team_id' => $team->id,
                    'user_id' => $memberId,
                    'status' => TeamMembershipStatus::Approved,
                ]);
            }
        });

        return redirect()->route('teams');
    }

    public function show(Request $request, Team $team): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);
        $this->authorize('view', $team);

        return Inertia::render('teams/show', $this->teamOverviewBuilder->showPageFor($team, $user));
    }

    public function update(UpdateTeamRequest $request, Team $team): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($user);
        abort_unless($team->organization_id === $organization->id, 404);

        $validated = $request->validated();
        $parentId = array_key_exists('parent_id', $validated)
            ? $validated['parent_id']
            : $team->parent_id;

        if ($parentId !== null && $this->isDescendant($team, (int) $parentId)) {
            return redirect()
                ->route('teams')
                ->withErrors(['parent_id' => 'Een team kan niet onder zichzelf hangen.']);
        }

        $memberIds = collect($validated['member_ids'] ?? [])
            ->map(fn (mixed $id): int => (int) $id)
            ->unique()
            ->values();

        DB::transaction(function () use ($team, $validated, $parentId, $memberIds): void {
            $team->update([
                'name' => $validated['name'],
                'department' => $validated['department'] ?? null,
                'parent_id' => $parentId,
            ]);

            TeamMembership::query()
                ->where('team_id', $team->id)
                ->where('status', TeamMembershipStatus::Approved)
                ->whereNotIn('user_id', $memberIds)
                ->delete();

            foreach ($memberIds as $memberId) {
                TeamMembership::query()->updateOrCreate(
                    [
                        'team_id' => $team->id,
                        'user_id' => $memberId,
                    ],
                    ['status' => TeamMembershipStatus::Approved],
                );
            }
        });

        return redirect()->route('teams.show', $team);
    }

    public function destroy(Request $request, Team $team): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($user);
        abort_unless($team->organization_id === $organization->id, 404);

        if ($team->children()->exists()) {
            return redirect()
                ->route('teams')
                ->withErrors(['team' => 'Verwijder eerst de subteams.']);
        }

        $team->delete();

        return redirect()->route('teams');
    }

    /**
     * @return array{
     *     id: int,
     *     status: string,
     *     team: array{id: int, name: string},
     *     user: array{id: int, name: string, email: string}
     * }
     */
    private function pendingPayload(TeamMembership $membership): array
    {
        return [
            'id' => $membership->id,
            'status' => $membership->status->value,
            'team' => [
                'id' => $membership->team->id,
                'name' => $membership->team->name,
            ],
            'user' => [
                'id' => $membership->user->id,
                'name' => $membership->user->name,
                'email' => $membership->user->email,
            ],
        ];
    }

    private function isDescendant(Team $team, int $parentId): bool
    {
        $current = Team::query()->find($parentId);

        while ($current !== null) {
            if ($current->id === $team->id) {
                return true;
            }

            $current = $current->parent_id !== null
                ? Team::query()->find($current->parent_id)
                : null;
        }

        return false;
    }
}
