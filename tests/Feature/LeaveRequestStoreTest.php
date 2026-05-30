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

it('stores a pending leave request for the authenticated user', function () {
    $user = User::factory()->create();
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    $this->actingAs($user)
        ->post(route('leaveRequests.store'), [
            'type' => LeaveType::Vacation->value,
            'starts_on' => $monday->addDays(14)->toDateString(),
            'ends_on' => $monday->addDays(16)->toDateString(),
            'notes' => 'Familiebezoek',
        ])
        ->assertRedirect(route('leaveRequests'));

    $request = LeaveRequest::query()->where('user_id', $user->id)->sole();

    expect($request->type)->toBe(LeaveType::Vacation)
        ->and($request->status)->toBe(LeaveRequestStatus::Pending)
        ->and($request->starts_on->format('Y-m-d'))->toBe($monday->addDays(14)->toDateString())
        ->and($request->ends_on->format('Y-m-d'))->toBe($monday->addDays(16)->toDateString())
        ->and($request->notes)->toBe('Familiebezoek');
});

it('validates leave request dates and type', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('leaveRequests.store'), [
            'type' => 'invalid',
            'starts_on' => '2026-06-10',
            'ends_on' => '2026-06-05',
        ])
        ->assertSessionHasErrors(['type', 'ends_on']);
});

it('requires authentication to store a leave request', function () {
    $this->post(route('leaveRequests.store'), [
        'type' => LeaveType::Personal->value,
        'starts_on' => '2026-06-01',
        'ends_on' => '2026-06-01',
    ])
        ->assertRedirect(route('login'));
});
