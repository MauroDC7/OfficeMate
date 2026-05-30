<?php

namespace App\Http\Controllers;

use App\Enums\LeaveRequestStatus;
use App\Enums\LeaveType;
use App\Http\Requests\StoreLeaveRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

final class LeaveRequestController extends Controller
{
    public function store(StoreLeaveRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $validated = $request->validated();

        $user->leaveRequests()->create([
            'starts_on' => $validated['starts_on'],
            'ends_on' => $validated['ends_on'],
            'type' => LeaveType::from($validated['type']),
            'notes' => $validated['notes'] ?? null,
            'status' => LeaveRequestStatus::Pending,
        ]);

        return redirect()->route('leaveRequests');
    }
}
