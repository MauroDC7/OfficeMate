<?php

use App\Enums\TeamMembershipStatus;
use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\Organization;
use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMembership;
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

it('shows employee dashboard stats scoped to the user and current week', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->forOrganization($organization)->create(['role' => UserRole::Employee]);
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    $team = Team::factory()->for($organization)->create();
    TeamMembership::factory()
        ->for($team)
        ->for($user)
        ->create(['status' => TeamMembershipStatus::Approved]);

    $accessibleProject = Project::factory()->for($organization)->create();
    $accessibleProject->teams()->attach($team);
    Project::factory()->for($organization)->inactive()->create();
    Project::factory()->for($organization)->create();

    TimesheetEntryProposal::factory()->for($user)->count(2)->create([
        'worked_on' => $monday->addDay(),
    ]);
    TimesheetEntryProposal::factory()->for($user)->create([
        'worked_on' => $monday->subWeek(),
    ]);

    TimesheetEntry::factory()->for($user)->create([
        'worked_on' => $monday->toDateString(),
        'start_minutes' => 9 * 60,
        'end_minutes' => 12 * 60,
    ]);

    LeaveRequest::factory()->for($user)->approved()->create([
        'starts_on' => $monday->addDays(10)->toDateString(),
        'ends_on' => $monday->addDays(12)->toDateString(),
    ]);

    LeaveRequest::factory()->for($user)->pending()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('activeProjects', 1)
            ->where('activeProjects.0.id', $accessibleProject->id)
            ->where('actionCount', 2)
            ->where('pendingTimesheetCount', 2)
            ->where('hoursThisWeekMinutes', 180)
            ->where('openLeaveDays', 3)
            ->where('pendingLeaveRequestCount', 1)
            ->where('weeklyStatusReminderDue', false)
            ->where('weekStart', $monday->toDateString())
            ->has('recentNotifications', 0));
});

it('counts only actionable timesheet proposals in action count', function () {
    $user = User::factory()->create(['role' => UserRole::Employee]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('actionCount', 0)
            ->where('pendingTimesheetCount', 0)
            ->where('pendingLeaveRequestCount', 0));
});

it('renders admin dashboard for administrators', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/dashboard'));
});
