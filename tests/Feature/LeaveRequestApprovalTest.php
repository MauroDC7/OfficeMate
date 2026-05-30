<?php

use App\Enums\LeaveRequestStatus;
use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\Organization;
use App\Models\User;

it('allows an admin to approve a pending leave request in their organization', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $employee = User::factory()->forOrganization($organization)->create();
    $leaveRequest = LeaveRequest::factory()->for($employee)->pending()->create();

    $this->actingAs($admin)
        ->post(route('leaveRequests.approve', $leaveRequest))
        ->assertRedirect(route('dashboard'));

    $leaveRequest->refresh();

    expect($leaveRequest->status)->toBe(LeaveRequestStatus::Approved)
        ->and($leaveRequest->rejection_reason)->toBeNull();
});

it('allows an admin to reject a pending leave request with a reason', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $employee = User::factory()->forOrganization($organization)->create();
    $leaveRequest = LeaveRequest::factory()->for($employee)->pending()->create();

    $this->actingAs($admin)
        ->post(route('leaveRequests.reject', $leaveRequest), [
            'rejection_reason' => 'Te weinig capaciteit',
        ])
        ->assertRedirect(route('dashboard'));

    $leaveRequest->refresh();

    expect($leaveRequest->status)->toBe(LeaveRequestStatus::Rejected)
        ->and($leaveRequest->rejection_reason)->toBe('Te weinig capaciteit');
});

it('forbids employees from approving leave requests', function () {
    $user = User::factory()->create();
    $leaveRequest = LeaveRequest::factory()->for($user)->pending()->create();

    $this->actingAs($user)
        ->post(route('leaveRequests.approve', $leaveRequest))
        ->assertForbidden();
});

it('forbids admins from approving leave requests outside their organization', function () {
    $admin = User::factory()->forOrganization(Organization::factory()->create())->create([
        'role' => UserRole::Admin,
    ]);
    $employee = User::factory()->forOrganization(Organization::factory()->create())->create();
    $leaveRequest = LeaveRequest::factory()->for($employee)->pending()->create();

    $this->actingAs($admin)
        ->post(route('leaveRequests.approve', $leaveRequest))
        ->assertForbidden();
});

it('lists pending leave requests on the admin dashboard', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $employee = User::factory()->forOrganization($organization)->create([
        'first_name' => 'Sam',
        'last_name' => 'Peeters',
    ]);

    LeaveRequest::factory()->for($employee)->pending()->vacation()->create([
        'starts_on' => '2026-07-01',
        'ends_on' => '2026-07-03',
    ]);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->has('pendingLeaveRequests', 1)
            ->where('pendingLeaveRequests.0.user.name', 'Sam Peeters')
            ->where('pendingLeaveRequests.0.type_label', 'Vakantie'));
});
