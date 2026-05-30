<?php

namespace App\Http\Controllers;

use App\Enums\LeaveRequestStatus;
use App\Enums\LeaveType;
use App\Http\Requests\BulkApproveLeaveRequests;
use App\Http\Requests\RejectLeaveRequest;
use App\Http\Requests\StoreLeaveRequest;
use App\Http\Requests\UpdateLeaveRequest;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Services\LeaveRequestMedicalCertificateStorage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class LeaveRequestController extends Controller
{
    public function __construct(
        private readonly LeaveRequestMedicalCertificateStorage $medicalCertificateStorage,
    ) {}

    public function store(StoreLeaveRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $validated = $request->validated();
        $type = LeaveType::from($validated['type']);

        $leaveRequest = $user->leaveRequests()->create([
            'starts_on' => $validated['starts_on'],
            'ends_on' => $validated['ends_on'],
            'type' => $type,
            'notes' => $validated['notes'] ?? null,
            'status' => LeaveRequestStatus::Pending,
        ]);

        if ($type === LeaveType::Sick && $request->hasFile('medical_certificate')) {
            $this->medicalCertificateStorage->store($leaveRequest, $request->file('medical_certificate'));
        }

        return redirect()->route('leaveRequests');
    }

    public function update(UpdateLeaveRequest $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        $validated = $request->validated();
        $type = LeaveType::from($validated['type']);

        $leaveRequest->update([
            'starts_on' => $validated['starts_on'],
            'ends_on' => $validated['ends_on'],
            'type' => $type,
            'notes' => $validated['notes'] ?? null,
        ]);

        if ($type === LeaveType::Sick) {
            if ($request->hasFile('medical_certificate')) {
                $this->medicalCertificateStorage->store($leaveRequest, $request->file('medical_certificate'));
            }
        } else {
            $this->medicalCertificateStorage->deleteFor($leaveRequest);
        }

        return redirect()->route('leaveRequests');
    }

    public function destroy(LeaveRequest $leaveRequest): RedirectResponse
    {
        $this->authorize('delete', $leaveRequest);

        $leaveRequest->delete();

        return redirect()->route('leaveRequests');
    }

    public function medicalCertificate(LeaveRequest $leaveRequest): StreamedResponse
    {
        $this->authorize('viewMedicalCertificate', $leaveRequest);

        $attachment = $leaveRequest->attachments()->firstOrFail();

        return Storage::disk('local')->download(
            $attachment->path,
            $attachment->original_name,
        );
    }

    public function approve(LeaveRequest $leaveRequest): RedirectResponse
    {
        $this->authorize('approve', $leaveRequest);

        $this->markApproved($leaveRequest);

        return redirect()->route('dashboard');
    }

    public function bulkApprove(BulkApproveLeaveRequests $request): RedirectResponse
    {
        /** @var list<int> $ids */
        $ids = $request->validated('leave_request_ids');

        $leaveRequests = LeaveRequest::query()
            ->whereIn('id', $ids)
            ->with('user')
            ->get();

        if ($leaveRequests->count() !== count($ids)) {
            abort(404);
        }

        foreach ($leaveRequests as $leaveRequest) {
            $this->authorize('approve', $leaveRequest);
        }

        LeaveRequest::query()
            ->whereIn('id', $ids)
            ->update([
                'status' => LeaveRequestStatus::Approved,
                'rejection_reason' => null,
            ]);

        return redirect()->route('dashboard');
    }

    private function markApproved(LeaveRequest $leaveRequest): void
    {
        $leaveRequest->update([
            'status' => LeaveRequestStatus::Approved,
            'rejection_reason' => null,
        ]);
    }

    public function reject(RejectLeaveRequest $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        $validated = $request->validated();

        $leaveRequest->update([
            'status' => LeaveRequestStatus::Rejected,
            'rejection_reason' => $validated['rejection_reason'] ?? null,
        ]);

        return redirect()->route('dashboard');
    }
}
