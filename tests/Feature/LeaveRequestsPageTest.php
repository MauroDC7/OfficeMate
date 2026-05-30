<?php

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

it('renders leave requests page with user data', function () {
    $user = User::factory()->create(['annual_leave_days' => 20]);
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    LeaveRequest::factory()->for($user)->approved()->vacation()->create([
        'starts_on' => $monday->addDays(10)->toDateString(),
        'ends_on' => $monday->addDays(12)->toDateString(),
    ]);

    LeaveRequest::factory()->for($user)->pending()->create([
        'starts_on' => $monday->addDays(20)->toDateString(),
        'ends_on' => $monday->addDays(21)->toDateString(),
        'type' => LeaveType::Personal,
    ]);

    LeaveRequest::factory()->create();

    $this->actingAs($user)
        ->get(route('leaveRequests'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('leaveRequests')
            ->where('balance.year', 2026)
            ->where('balance.annual_days', 20)
            ->where('balance.used_days', 3)
            ->where('balance.pending_days', 2)
            ->where('balance.remaining_days', 17)
            ->where('stats.openLeaveDays', 3)
            ->where('stats.pendingCount', 1)
            ->where('stats.approvedUpcomingCount', 1)
            ->has('requests', 2)
            ->where('requests.0.type', 'personal')
            ->where('requests.0.type_label', 'Persoonlijk verlof')
            ->where('requests.0.status', 'pending')
            ->where('requests.1.type', 'vacation')
            ->where('requests.1.type_label', 'Vakantie')
            ->where('requests.1.status', 'approved')
            ->where('requests.1.day_count', 3)
            ->where('requests.0.can_edit', true)
            ->where('requests.1.can_edit', false));
});

it('requires authentication for leave requests page', function () {
    $this->get(route('leaveRequests'))
        ->assertRedirect(route('login'));
});
