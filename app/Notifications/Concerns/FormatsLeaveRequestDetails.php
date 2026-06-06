<?php

namespace App\Notifications\Concerns;

use App\Models\LeaveRequest;
use App\Models\User;

trait FormatsLeaveRequestDetails
{
    protected function leaveRequestPeriodLabel(LeaveRequest $leaveRequest): string
    {
        $start = $leaveRequest->starts_on->format('d/m/Y');
        $end = $leaveRequest->ends_on->format('d/m/Y');

        if ($start === $end) {
            return $start;
        }

        return "{$start} tot {$end}";
    }

    protected function leaveRequestEmployeeName(LeaveRequest $leaveRequest): string
    {
        $leaveRequest->loadMissing('user');

        return $leaveRequest->user instanceof User
            ? $leaveRequest->user->name
            : 'Medewerker';
    }
}
