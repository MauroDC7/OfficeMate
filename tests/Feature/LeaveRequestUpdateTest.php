<?php

use App\Enums\LeaveRequestStatus;
use App\Enums\LeaveType;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\CarbonImmutable;

beforeEach(function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-19 10:00:00', 'UTC'));
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

it('updates a pending leave request for the owner', function () {
    $user = User::factory()->create();
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    $leaveRequest = LeaveRequest::factory()->for($user)->pending()->vacation()->create([
        'starts_on' => $monday->addDays(10)->toDateString(),
        'ends_on' => $monday->addDays(12)->toDateString(),
    ]);

    $this->actingAs($user)
        ->patch(route('leaveRequests.update', $leaveRequest), [
            'type' => LeaveType::Personal->value,
            'starts_on' => $monday->addDays(20)->toDateString(),
            'ends_on' => $monday->addDays(21)->toDateString(),
            'notes' => 'Aangepast',
        ])
        ->assertRedirect(route('leaveRequests'));

    $leaveRequest->refresh();

    expect($leaveRequest->type)->toBe(LeaveType::Personal)
        ->and($leaveRequest->status)->toBe(LeaveRequestStatus::Pending)
        ->and($leaveRequest->starts_on->format('Y-m-d'))->toBe($monday->addDays(20)->toDateString())
        ->and($leaveRequest->ends_on->format('Y-m-d'))->toBe($monday->addDays(21)->toDateString())
        ->and($leaveRequest->notes)->toBe('Aangepast');
});

it('forbids updating an approved leave request', function () {
    $user = User::factory()->create();
    $leaveRequest = LeaveRequest::factory()->for($user)->approved()->create();

    $this->actingAs($user)
        ->patch(route('leaveRequests.update', $leaveRequest), [
            'type' => LeaveType::Vacation->value,
            'starts_on' => '2026-07-01',
            'ends_on' => '2026-07-02',
        ])
        ->assertForbidden();
});

it('forbids updating another users leave request', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $leaveRequest = LeaveRequest::factory()->for($owner)->pending()->create();

    $this->actingAs($other)
        ->patch(route('leaveRequests.update', $leaveRequest), [
            'type' => LeaveType::Vacation->value,
            'starts_on' => '2026-07-01',
            'ends_on' => '2026-07-02',
        ])
        ->assertForbidden();
});
