<?php

namespace App\Services;

use App\Enums\LeaveRequestStatus;
use App\Models\LeaveRequest;

final class LeaveRequestOverlapChecker
{
    public function overlapsForUser(
        int $userId,
        string $startsOn,
        string $endsOn,
        ?int $ignoreLeaveRequestId = null,
    ): bool {
        return LeaveRequest::query()
            ->where('user_id', $userId)
            ->whereIn('status', [LeaveRequestStatus::Pending, LeaveRequestStatus::Approved])
            ->when(
                $ignoreLeaveRequestId !== null,
                fn ($query) => $query->where('id', '!=', $ignoreLeaveRequestId),
            )
            ->where('starts_on', '<=', $endsOn)
            ->where('ends_on', '>=', $startsOn)
            ->exists();
    }
}
