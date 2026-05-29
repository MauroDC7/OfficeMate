<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Project;
use App\Models\User;

final class ProjectPolicy
{
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
