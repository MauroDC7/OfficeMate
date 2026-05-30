<?php

use App\Enums\LeaveRequestStatus;
use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\Organization;
use App\Models\User;

it('allows an admin to bulk approve pending leave requests', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $employee = User::factory()->forOrganization($organization)->create();

    $first = LeaveRequest::factory()->for($employee)->pending()->create();
    $second = LeaveRequest::factory()->for($employee)->pending()->create();

    $this->actingAs($admin)
        ->post(route('leaveRequests.bulkApprove'), [
            'leave_request_ids' => [$first->id, $second->id],
        ])
        ->assertRedirect(route('admin.leaveRequests'));

    expect($first->fresh()->status)->toBe(LeaveRequestStatus::Approved)
        ->and($second->fresh()->status)->toBe(LeaveRequestStatus::Approved);
});

it('forbids bulk approving leave requests from another organization', function () {
    $admin = User::factory()->forOrganization(Organization::factory()->create())->create([
        'role' => UserRole::Admin,
    ]);
    $employee = User::factory()->forOrganization(Organization::factory()->create())->create();
    $leaveRequest = LeaveRequest::factory()->for($employee)->pending()->create();

    $this->actingAs($admin)
        ->post(route('leaveRequests.bulkApprove'), [
            'leave_request_ids' => [$leaveRequest->id],
        ])
        ->assertForbidden();
});

it('requires at least one leave request id', function () {
    $admin = User::factory()->forOrganization(Organization::factory()->create())->create([
        'role' => UserRole::Admin,
    ]);

    $this->actingAs($admin)
        ->post(route('leaveRequests.bulkApprove'), [
            'leave_request_ids' => [],
        ])
        ->assertSessionHasErrors('leave_request_ids');
});

it('forbids employees from bulk approving leave requests', function () {
    $user = User::factory()->create();
    $leaveRequest = LeaveRequest::factory()->for($user)->pending()->create();

    $this->actingAs($user)
        ->post(route('leaveRequests.bulkApprove'), [
            'leave_request_ids' => [$leaveRequest->id],
        ])
        ->assertForbidden();
});
