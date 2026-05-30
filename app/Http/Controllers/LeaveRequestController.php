<?php

namespace App\Http\Controllers;

use App\Enums\LeaveRequestStatus;
use App\Enums\LeaveType;
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
}
