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

it('rejects a leave request that overlaps with an approved period', function () {
    $user = User::factory()->create();

    LeaveRequest::factory()->for($user)->approved()->create([
        'starts_on' => '2026-06-10',
        'ends_on' => '2026-06-12',
    ]);

    $this->actingAs($user)
        ->post(route('leaveRequests.store'), [
            'type' => LeaveType::Vacation->value,
            'starts_on' => '2026-06-11',
            'ends_on' => '2026-06-14',
        ])
        ->assertSessionHasErrors('starts_on');

    expect(LeaveRequest::query()->where('user_id', $user->id)->count())->toBe(1);
});

it('rejects a leave request that overlaps with a pending period', function () {
    $user = User::factory()->create();

    LeaveRequest::factory()->for($user)->pending()->create([
        'starts_on' => '2026-07-01',
        'ends_on' => '2026-07-05',
    ]);

    $this->actingAs($user)
        ->post(route('leaveRequests.store'), [
            'type' => LeaveType::Personal->value,
            'starts_on' => '2026-06-28',
            'ends_on' => '2026-07-02',
        ])
        ->assertSessionHasErrors('starts_on');
});

it('allows adjacent leave periods that do not overlap', function () {
    $user = User::factory()->create();

    LeaveRequest::factory()->for($user)->approved()->create([
        'starts_on' => '2026-06-01',
        'ends_on' => '2026-06-05',
    ]);

    $this->actingAs($user)
        ->post(route('leaveRequests.store'), [
            'type' => LeaveType::Vacation->value,
            'starts_on' => '2026-06-06',
            'ends_on' => '2026-06-08',
        ])
        ->assertRedirect(route('leaveRequests'));

    expect(LeaveRequest::query()->where('user_id', $user->id)->count())->toBe(2);
});

it('ignores rejected leave when checking for overlap', function () {
    $user = User::factory()->create();

    LeaveRequest::factory()->for($user)->create([
        'starts_on' => '2026-08-01',
        'ends_on' => '2026-08-05',
        'status' => LeaveRequestStatus::Rejected,
    ]);

    $this->actingAs($user)
        ->post(route('leaveRequests.store'), [
            'type' => LeaveType::Vacation->value,
            'starts_on' => '2026-08-02',
            'ends_on' => '2026-08-03',
        ])
        ->assertRedirect(route('leaveRequests'));
});

it('allows updating a pending request without conflicting with itself', function () {
    $user = User::factory()->create();
    $leaveRequest = LeaveRequest::factory()->for($user)->pending()->vacation()->create([
        'starts_on' => '2026-09-01',
        'ends_on' => '2026-09-05',
    ]);

    $this->actingAs($user)
        ->patch(route('leaveRequests.update', $leaveRequest), [
            'type' => LeaveType::Vacation->value,
            'starts_on' => '2026-09-01',
            'ends_on' => '2026-09-07',
        ])
        ->assertRedirect(route('leaveRequests'));
});

it('rejects updating a pending request into an overlapping period', function () {
    $user = User::factory()->create();

    LeaveRequest::factory()->for($user)->approved()->create([
        'starts_on' => '2026-10-10',
        'ends_on' => '2026-10-15',
    ]);

    $pending = LeaveRequest::factory()->for($user)->pending()->create([
        'starts_on' => '2026-11-01',
        'ends_on' => '2026-11-03',
    ]);

    $this->actingAs($user)
        ->patch(route('leaveRequests.update', $pending), [
            'type' => LeaveType::Vacation->value,
            'starts_on' => '2026-10-12',
            'ends_on' => '2026-10-20',
        ])
        ->assertSessionHasErrors('starts_on');
});

it('rejects sick leave without overlap but still requires a certificate', function () {
    $user = User::factory()->create();

    LeaveRequest::factory()->for($user)->approved()->create([
        'starts_on' => '2026-06-10',
        'ends_on' => '2026-06-12',
    ]);

    $this->actingAs($user)
        ->post(route('leaveRequests.store'), [
            'type' => LeaveType::Sick->value,
            'starts_on' => '2026-07-01',
            'ends_on' => '2026-07-02',
        ])
        ->assertSessionHasErrors('medical_certificate');
});
