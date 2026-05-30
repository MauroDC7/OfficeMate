<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\User;

final class LeaveRequestPolicy
{
    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, LeaveRequest $leaveRequest): bool
    {
        return $leaveRequest->user_id === $user->id && $leaveRequest->isPending();
    }

    public function delete(User $user, LeaveRequest $leaveRequest): bool
    {
        return $this->update($user, $leaveRequest);
    }

    public function viewMedicalCertificate(User $user, LeaveRequest $leaveRequest): bool
    {
        if ($leaveRequest->user_id === $user->id) {
            return true;
        }

        return $user->role === UserRole::Admin
            && $user->organization_id !== null
            && $leaveRequest->user->organization_id === $user->organization_id;
    }
}
