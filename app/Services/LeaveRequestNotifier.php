<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Notifications\LeaveRequestApprovedNotification;
use App\Notifications\LeaveRequestRejectedNotification;
use App\Notifications\LeaveRequestSubmittedNotification;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;

final class LeaveRequestNotifier
{
    public function notifyAdminsOfSubmission(LeaveRequest $leaveRequest): void
    {
        $leaveRequest->loadMissing('user');

        $organizationId = $leaveRequest->user?->organization_id;

        if ($organizationId === null) {
            return;
        }

        $admins = User::query()
            ->where('organization_id', $organizationId)
            ->where('role', UserRole::Admin)
            ->get();

        if ($admins->isEmpty()) {
            return;
        }

        $notification = new LeaveRequestSubmittedNotification($leaveRequest);

        foreach ($admins as $admin) {
            $this->sendSafely($admin, $notification);
        }
    }

    public function notifyEmployeeOfApproval(LeaveRequest $leaveRequest): void
    {
        $this->notifyEmployee($leaveRequest, new LeaveRequestApprovedNotification($leaveRequest));
    }

    public function notifyEmployeeOfRejection(LeaveRequest $leaveRequest): void
    {
        $this->notifyEmployee($leaveRequest, new LeaveRequestRejectedNotification($leaveRequest));
    }

    /**
     * @param  Collection<int, LeaveRequest>  $leaveRequests
     */
    public function notifyEmployeesOfBulkApproval(Collection $leaveRequests): void
    {
        foreach ($leaveRequests as $leaveRequest) {
            $this->notifyEmployeeOfApproval($leaveRequest);
        }
    }

    private function notifyEmployee(LeaveRequest $leaveRequest, Notification $notification): void
    {
        $leaveRequest->loadMissing('user');

        if (! $leaveRequest->user instanceof User) {
            return;
        }

        $this->sendSafely($leaveRequest->user, $notification);
    }

    private function sendSafely(User $user, Notification $notification): void
    {
        try {
            $user->notify($notification);
        } catch (\Throwable $exception) {
            report($exception);
        }
    }
}
