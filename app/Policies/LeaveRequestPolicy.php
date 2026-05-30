<?php

namespace App\Policies;

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
}
