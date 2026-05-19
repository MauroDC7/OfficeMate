<?php

use App\Enums\UserRole;
use App\Models\Project;
use App\Models\TimesheetEntry;
use App\Models\TimesheetEntryProposal;
use App\Models\User;
use Carbon\CarbonImmutable;

beforeEach(function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-19 10:00:00', 'UTC'));
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

it('shows employee dashboard stats', function () {
    $user = User::factory()->create(['role' => UserRole::Employee]);
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    Project::factory()->count(2)->create();
    Project::factory()->inactive()->create();

    TimesheetEntryProposal::factory()->for($user)->count(3)->create();

    TimesheetEntry::factory()->for($user)->create([
        'worked_on' => $monday->toDateString(),
        'start_minutes' => 9 * 60,
        'end_minutes' => 12 * 60,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('activeProjects', 2)
            ->where('pendingTimesheetCount', 3)
            ->where('hoursThisWeekMinutes', 180)
            ->where('weekStart', $monday->toDateString())
            ->has('recentNotifications', 0));
});

it('renders admin dashboard for administrators', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/dashboard'));
});
