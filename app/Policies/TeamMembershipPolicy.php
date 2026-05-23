<?php

namespace App\Policies;

use App\Enums\TeamMembershipStatus;
use App\Enums\UserRole;
use App\Models\TeamMembership;
use App\Models\User;

final class TeamMembershipPolicy
{
    public function request(User $user): bool
    {
        return $user->role === UserRole::Employee || $user->role === UserRole::Admin;
    }

    public function approve(User $user, TeamMembership $membership): bool
    {
        return $user->role === UserRole::Admin
            && $membership->status === TeamMembershipStatus::Pending;
    }

    public function reject(User $user, TeamMembership $membership): bool
    {
        return $user->role === UserRole::Admin
            && $membership->status === TeamMembershipStatus::Pending;
    }

    public function leave(User $user, TeamMembership $membership): bool
    {
        return $user->id === $membership->user_id;
    }
}
