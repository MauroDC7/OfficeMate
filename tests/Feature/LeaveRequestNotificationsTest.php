<?php

declare(strict_types=1);

use App\Enums\LeaveRequestStatus;
use App\Enums\LeaveType;
use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\Organization;
use App\Models\User;
use App\Events\InAppNotificationChanged;
use App\Notifications\LeaveRequestApprovedNotification;
use App\Notifications\LeaveRequestRejectedNotification;
use App\Notifications\LeaveRequestSubmittedNotification;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-19 10:00:00', 'UTC'));
    Event::fake([InAppNotificationChanged::class]);
    Notification::fake();
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

it('notifies organization admins when an employee submits leave', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $employee = User::factory()->forOrganization($organization)->create();
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    $this->actingAs($employee)
        ->post(route('leaveRequests.store'), [
            'type' => LeaveType::Vacation->value,
            'starts_on' => $monday->addDays(14)->toDateString(),
            'ends_on' => $monday->addDays(16)->toDateString(),
        ])
        ->assertRedirect(route('leaveRequests'));

    Notification::assertSentTo($admin, LeaveRequestSubmittedNotification::class);
    Notification::assertNotSentTo($employee, LeaveRequestSubmittedNotification::class);
});

it('does not notify admins when the employee has no organization', function () {
    $employee = User::factory()->create(['organization_id' => null]);
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    $this->actingAs($employee)
        ->post(route('leaveRequests.store'), [
            'type' => LeaveType::Vacation->value,
            'starts_on' => $monday->addDays(14)->toDateString(),
            'ends_on' => $monday->addDays(16)->toDateString(),
        ])
        ->assertRedirect(route('leaveRequests'));

    Notification::assertNothingSent();
});

it('notifies the employee when an admin approves leave', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $employee = User::factory()->forOrganization($organization)->create();
    $leaveRequest = LeaveRequest::factory()->for($employee)->pending()->create();

    $this->actingAs($admin)
        ->post(route('leaveRequests.approve', $leaveRequest))
        ->assertRedirect(route('admin.leaveRequests'));

    Notification::assertSentTo($employee, LeaveRequestApprovedNotification::class);
    Notification::assertNotSentTo($admin, LeaveRequestApprovedNotification::class);
});

it('notifies each employee when an admin bulk approves leave', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $firstEmployee = User::factory()->forOrganization($organization)->create();
    $secondEmployee = User::factory()->forOrganization($organization)->create();

    $first = LeaveRequest::factory()->for($firstEmployee)->pending()->create();
    $second = LeaveRequest::factory()->for($secondEmployee)->pending()->create();

    $this->actingAs($admin)
        ->post(route('leaveRequests.bulkApprove'), [
            'leave_request_ids' => [$first->id, $second->id],
        ])
        ->assertRedirect(route('admin.leaveRequests'));

    Notification::assertSentTo($firstEmployee, LeaveRequestApprovedNotification::class);
    Notification::assertSentTo($secondEmployee, LeaveRequestApprovedNotification::class);
});

it('notifies the employee when an admin rejects leave with a reason', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $employee = User::factory()->forOrganization($organization)->create();
    $leaveRequest = LeaveRequest::factory()->for($employee)->pending()->create();

    $this->actingAs($admin)
        ->post(route('leaveRequests.reject', $leaveRequest), [
            'rejection_reason' => 'Te weinig capaciteit',
        ])
        ->assertRedirect(route('admin.leaveRequests'));

    Notification::assertSentTo($employee, LeaveRequestRejectedNotification::class);

    expect($leaveRequest->fresh()->status)->toBe(LeaveRequestStatus::Rejected);
});
