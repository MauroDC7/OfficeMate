<?php

namespace App\Services;

use App\Enums\LeaveRequestStatus;
use App\Models\LeaveRequest;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;

final class AdminLeaveRequestPageData
{
    /**
     * @return array{
     *     organizationName: string,
     *     filters: array{status: string, search: string},
     *     counts: array{pending: int, approved: int, rejected: int},
     *     requests: list<array{
     *         id: int,
     *         starts_on: string,
     *         ends_on: string,
     *         status: string,
     *         type: string,
     *         type_label: string,
     *         notes: string|null,
     *         rejection_reason: string|null,
     *         day_count: int,
     *         created_at: string,
     *         user: array{id: int, name: string, email: string},
     *         attachment: array{name: string, url: string}|null,
     *         can_approve: bool,
     *     }>
     * }
     */
    public function forOrganization(Organization $organization, Request $request): array
    {
        $status = $this->resolveStatusFilter($request);
        $search = $this->resolveSearch($request);

        $memberIds = User::query()
            ->where('organization_id', $organization->id)
            ->pluck('id')
            ->all();

        $counts = [
            'pending' => LeaveRequest::query()
                ->whereIn('user_id', $memberIds)
                ->where('status', LeaveRequestStatus::Pending)
                ->count(),
            'approved' => LeaveRequest::query()
                ->whereIn('user_id', $memberIds)
                ->where('status', LeaveRequestStatus::Approved)
                ->count(),
            'rejected' => LeaveRequest::query()
                ->whereIn('user_id', $memberIds)
                ->where('status', LeaveRequestStatus::Rejected)
                ->count(),
        ];

        $query = LeaveRequest::query()
            ->whereIn('user_id', $memberIds)
            ->with(['user:id,first_name,last_name,email,organization_id', 'attachments'])
            ->orderByDesc('starts_on')
            ->orderByDesc('id');

        if ($status !== 'all') {
            $query->where('status', LeaveRequestStatus::from($status));
        }

        if ($search !== '') {
            $needle = '%'.addcslashes($search, '%_\\').'%';

            $query->whereHas('user', function ($userQuery) use ($needle): void {
                $userQuery->where('first_name', 'like', $needle)
                    ->orWhere('last_name', 'like', $needle)
                    ->orWhere('email', 'like', $needle);
            });
        }

        $requests = $query
            ->limit(100)
            ->get()
            ->map(fn (LeaveRequest $leave): array => $this->mapRequest($leave))
            ->all();

        return [
            'organizationName' => $organization->name,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'counts' => $counts,
            'requests' => $requests,
        ];
    }

    /**
     * @return array{
     *     id: int,
     *     starts_on: string,
     *     ends_on: string,
     *     status: string,
     *     type: string,
     *     type_label: string,
     *     notes: string|null,
     *     rejection_reason: string|null,
     *     day_count: int,
     *     created_at: string,
     *     user: array{id: int, name: string, email: string},
     *     attachment: array{name: string, url: string}|null,
     *     can_approve: bool,
     * }
     */
    private function mapRequest(LeaveRequest $leave): array
    {
        $attachment = $leave->attachments->first();

        return [
            'id' => $leave->id,
            'starts_on' => $leave->starts_on->format('Y-m-d'),
            'ends_on' => $leave->ends_on->format('Y-m-d'),
            'status' => $leave->status->value,
            'type' => $leave->type->value,
            'type_label' => $leave->type->label(),
            'notes' => $leave->notes,
            'rejection_reason' => $leave->rejection_reason,
            'day_count' => $leave->dayCount(),
            'created_at' => $leave->created_at?->toIso8601String() ?? '',
            'user' => [
                'id' => $leave->user->id,
                'name' => $leave->user->name,
                'email' => $leave->user->email,
            ],
            'attachment' => $attachment !== null
                ? [
                    'name' => $attachment->original_name,
                    'url' => route('leaveRequests.medicalCertificate', $leave),
                ]
                : null,
            'can_approve' => $leave->status === LeaveRequestStatus::Pending,
        ];
    }

    private function resolveStatusFilter(Request $request): string
    {
        $status = $request->query('status');

        if (! is_string($status)) {
            return 'pending';
        }

        return in_array($status, ['pending', 'approved', 'rejected', 'all'], true)
            ? $status
            : 'pending';
    }

    private function resolveSearch(Request $request): string
    {
        $search = $request->query('search');

        if (! is_string($search)) {
            return '';
        }

        return trim($search);
    }
}
