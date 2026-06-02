<?php

namespace App\Policies;

use App\Enums\TeamMembershipStatus;
use App\Enums\UserRole;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\User;

final class TeamPolicy
{
    public function view(User $user, Team $team): bool
    {
        if ($user->organization_id !== $team->organization_id) {
            return false;
        }

        if ($user->role === UserRole::Admin) {
            return true;
        }

        return TeamMembership::query()
            ->where('team_id', $team->id)
            ->where('user_id', $user->id)
            ->where('status', TeamMembershipStatus::Approved)
            ->exists();
    }

    public function update(User $user, Team $team): bool
    {
        return $user->role === UserRole::Admin
            && $user->organization_id === $team->organization_id;
    }

    public function delete(User $user, Team $team): bool
    {
        return $this->update($user, $team);
    }
}
