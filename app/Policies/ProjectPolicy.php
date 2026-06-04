<?php

namespace App\Policies;

use App\Enums\TeamMembershipStatus;
use App\Enums\UserRole;
use App\Models\Project;
use App\Models\User;

final class ProjectPolicy
{
    public function view(User $user, Project $project): bool
    {
        if ($user->organization_id !== $project->organization_id) {
            return false;
        }

        if ($user->role === UserRole::Admin) {
            return true;
        }

        if ($project->created_by === $user->id) {
            return true;
        }

        return $project->teams()
            ->whereHas('memberships', fn ($query) => $query
                ->where('user_id', $user->id)
                ->where('status', TeamMembershipStatus::Approved),
            )
            ->exists();
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Admin || $user->can_create_projects === true;
    }

    public function update(User $user, Project $project): bool
    {
        return $user->role === UserRole::Admin
            && $project->organization_id === $user->organization_id;
    }

    public function delete(User $user, Project $project): bool
    {
        return $this->update($user, $project);
    }
}
