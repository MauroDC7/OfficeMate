<?php

namespace App\Policies;

use App\Enums\LeaveRequestStatus;
use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\User;

final class LeaveRequestPolicy
{
    public function create(User $user): bool
    {
        return $user->role === UserRole::Employee;
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

        return $this->manageOrganizationLeave($user, $leaveRequest);
    }

    public function approve(User $user, LeaveRequest $leaveRequest): bool
    {
        return $this->manageOrganizationLeave($user, $leaveRequest)
            && $leaveRequest->status === LeaveRequestStatus::Pending;
    }

    public function reject(User $user, LeaveRequest $leaveRequest): bool
    {
        return $this->approve($user, $leaveRequest);
    }

    private function manageOrganizationLeave(User $user, LeaveRequest $leaveRequest): bool
    {
        if ($user->role !== UserRole::Admin || $user->organization_id === null) {
            return false;
        }

        $leaveRequest->loadMissing('user');

        return $leaveRequest->user->organization_id === $user->organization_id;
    }
}
