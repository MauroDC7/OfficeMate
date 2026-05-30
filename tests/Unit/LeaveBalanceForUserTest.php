<?php

use App\Enums\LeaveType;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Services\LeaveBalanceForUser;
use Carbon\CarbonImmutable;

beforeEach(function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-19 10:00:00', 'UTC'));
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

it('calculates annual leave balance for vacation and personal leave', function () {
    $user = User::factory()->create(['annual_leave_days' => 25]);
    $service = app(LeaveBalanceForUser::class);

    LeaveRequest::factory()->for($user)->approved()->vacation()->create([
        'starts_on' => '2026-03-01',
        'ends_on' => '2026-03-03',
    ]);

    LeaveRequest::factory()->for($user)->pending()->create([
        'starts_on' => '2026-08-01',
        'ends_on' => '2026-08-01',
        'type' => LeaveType::Personal,
    ]);

    LeaveRequest::factory()->for($user)->approved()->sick()->create([
        'starts_on' => '2026-04-01',
        'ends_on' => '2026-04-05',
    ]);

    LeaveRequest::factory()->for($user)->approved()->vacation()->create([
        'starts_on' => '2025-12-01',
        'ends_on' => '2025-12-05',
    ]);

    $balance = $service->forUser($user);

    expect($balance)->toBe([
        'year' => 2026,
        'annual_days' => 25,
        'used_days' => 3,
        'pending_days' => 1,
        'remaining_days' => 22,
    ]);
});
