<?php

namespace App\Http\Controllers;

use App\Enums\TeamMembershipStatus;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\User;
use App\Services\OrganizationContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class TeamMembershipController extends Controller
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
    ) {}

    public function store(Request $request, Team $team): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);
        $this->authorize('request', TeamMembership::class);

        $organization = $this->organizationContext->forUserOrFail($user);
        abort_unless($team->organization_id === $organization->id, 404);

        $existing = TeamMembership::query()
            ->where('team_id', $team->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing !== null) {
            if ($existing->status === TeamMembershipStatus::Rejected) {
                $existing->update(['status' => TeamMembershipStatus::Pending]);
            }

            return redirect()->route('teams');
        }

        TeamMembership::query()->create([
            'team_id' => $team->id,
            'user_id' => $user->id,
            'status' => TeamMembershipStatus::Pending,
        ]);

        return redirect()->route('teams');
    }

    public function approve(TeamMembership $teamMembership): RedirectResponse
    {
        $this->authorize('approve', $teamMembership);

        $teamMembership->update(['status' => TeamMembershipStatus::Approved]);

        return redirect()->route('teams');
    }

    public function reject(TeamMembership $teamMembership): RedirectResponse
    {
        $this->authorize('reject', $teamMembership);

        $teamMembership->update(['status' => TeamMembershipStatus::Rejected]);

        return redirect()->route('teams');
    }

    public function destroy(TeamMembership $teamMembership): RedirectResponse
    {
        $this->authorize('leave', $teamMembership);

        $teamMembership->delete();

        return redirect()->route('teams');
    }
}
