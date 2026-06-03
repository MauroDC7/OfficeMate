<?php

use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\Organization;
use App\Models\OrganizationInvite;
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

it('shows admin dashboard stats for the organization', function () {
    $organization = Organization::factory()->create(['name' => 'Acme bvba']);
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);

    $employees = User::factory()
        ->count(3)
        ->forOrganization($organization)
        ->create(['role' => UserRole::Employee]);

    User::factory()->create(['role' => UserRole::Employee]);

    $team = Team::factory()->for($organization)->create();
    Team::factory()->for($organization)->create();

    TeamMembership::factory()->for($team)->for($employees[0])->pending()->create();
    TeamMembership::factory()->for($team)->for($employees[1])->pending()->create();
    TeamMembership::factory()->for($team)->approved()->create();

    LeaveRequest::factory()->for($employees[0])->pending()->create();
    LeaveRequest::factory()->for($employees[1])->approved()->create();

    TimesheetEntryProposal::factory()->for($employees[0])->count(2)->create();

    OrganizationInvite::query()->create([
        'organization_id' => $organization->id,
        'email' => 'pending@example.com',
        'token' => str_repeat('a', 64),
        'expires_at' => now()->addDays(3),
        'created_by_user_id' => $admin->id,
    ]);

    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    TimesheetEntry::factory()->for($employees[0])->create([
        'worked_on' => $monday->toDateString(),
        'start_minutes' => 9 * 60,
        'end_minutes' => 12 * 60,
    ]);
    TimesheetEntry::factory()->for($employees[1])->create([
        'worked_on' => $monday->addDay()->toDateString(),
        'start_minutes' => 9 * 60,
        'end_minutes' => 10 * 60,
    ]);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->where('organizationName', 'Acme bvba')
            ->where('memberCount', 4)
            ->where('teamCount', 2)
            ->where('pendingMembershipCount', 2)
            ->where('pendingLeaveRequestCount', 1)
            ->where('pendingProposalCount', 2)
            ->where('openInviteCount', 1)
            ->where('hoursThisWeekMinutes', 240)
            ->where('weekStart', $monday->toDateString())
            ->has('pendingMemberships', 2)
            ->has('pendingLeaveRequests', 1)
            ->has('currentLeave')
            ->where('employmentSetupCount', 0)
            ->where('presenceSummary.in_office', 0)
            ->where('presenceSummary.out_of_office', 4)
            ->where('presenceSummary.vacation', 0)
            ->where('presenceSummary.sick', 0)
            ->where('presenceSummary.other_leave', 0));
});

it('lists new employees who still need a contract on the admin dashboard', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);

    $newJoiner = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'first_name' => 'Nina',
        'last_name' => 'Bakker',
        'email' => 'nina@acme.test',
        'organization_joined_at' => now(),
        'employment_setup_completed_at' => null,
    ]);

    User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'employment_setup_completed_at' => now(),
        'organization_joined_at' => now()->subDay(),
    ]);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->where('employmentSetupCount', 1)
            ->has('employeesNeedingEmploymentSetup', 1)
            ->where('employeesNeedingEmploymentSetup.0.id', $newJoiner->id)
            ->where('employeesNeedingEmploymentSetup.0.email', 'nina@acme.test'));
});

it('includes the admin\'s own data in the totals', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    TimesheetEntry::factory()->for($admin)->create([
        'worked_on' => $monday->toDateString(),
        'start_minutes' => 9 * 60,
        'end_minutes' => 11 * 60,
    ]);
    TimesheetEntry::factory()->for($employee)->create([
        'worked_on' => $monday->toDateString(),
        'start_minutes' => 9 * 60,
        'end_minutes' => 10 * 60,
    ]);

    TimesheetEntryProposal::factory()->for($admin)->create();
    TimesheetEntryProposal::factory()->for($employee)->count(2)->create();

    LeaveRequest::factory()->for($admin)->pending()->create();

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->where('memberCount', 2)
            ->where('hoursThisWeekMinutes', 180)
            ->where('pendingProposalCount', 3)
            ->where('pendingLeaveRequestCount', 1));
});

it('returns empty admin dashboard for an organization without data', function () {
    $admin = User::factory()->admin()->create();

    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->where('memberCount', 1)
            ->where('teamCount', 0)
            ->where('pendingMembershipCount', 0)
            ->where('pendingLeaveRequestCount', 0)
            ->where('pendingProposalCount', 0)
            ->where('openInviteCount', 0)
            ->where('hoursThisWeekMinutes', 0)
            ->where('weekStart', $monday->toDateString())
            ->has('pendingMemberships', 0)
            ->has('currentLeave', 0));
});

it('limits pending memberships preview to five entries', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);

    $team = Team::factory()->for($organization)->create();

    foreach (range(1, 7) as $i) {
        $employee = User::factory()->forOrganization($organization)->create([
            'role' => UserRole::Employee,
        ]);

        TeamMembership::factory()
            ->for($team)
            ->for($employee)
            ->pending()
            ->create();
    }

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->where('pendingMembershipCount', 7)
            ->has('pendingMemberships', 5));
});

it('ignores pending memberships from other organizations', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);

    $otherOrganization = Organization::factory()->create();
    $otherTeam = Team::factory()->for($otherOrganization)->create();
    TeamMembership::factory()->for($otherTeam)->pending()->create();

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->where('pendingMembershipCount', 0)
            ->has('pendingMemberships', 0));
});

it('counts only open organization invites', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);

    OrganizationInvite::query()->create([
        'organization_id' => $organization->id,
        'email' => 'open@example.com',
        'token' => str_repeat('a', 64),
        'expires_at' => now()->addDays(3),
        'created_by_user_id' => $admin->id,
    ]);

    OrganizationInvite::query()->create([
        'organization_id' => $organization->id,
        'email' => 'redeemed@example.com',
        'token' => str_repeat('b', 64),
        'expires_at' => now()->addDays(3),
        'created_by_user_id' => $admin->id,
        'redeemed_at' => now(),
    ]);

    OrganizationInvite::query()->create([
        'organization_id' => $organization->id,
        'email' => 'expired@example.com',
        'token' => str_repeat('c', 64),
        'expires_at' => now()->subDay(),
        'created_by_user_id' => $admin->id,
    ]);

    $otherOrganization = Organization::factory()->create();
    OrganizationInvite::query()->create([
        'organization_id' => $otherOrganization->id,
        'email' => 'other@example.com',
        'token' => str_repeat('d', 64),
        'expires_at' => now()->addDays(3),
        'created_by_user_id' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->where('openInviteCount', 1));
});

it('lists approved leave that overlaps with the current week', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);

    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'first_name' => 'Lena',
        'last_name' => 'Janssens',
    ]);

    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    LeaveRequest::factory()->for($employee)->approved()->vacation()->create([
        'starts_on' => $monday->addDay()->toDateString(),
        'ends_on' => $monday->addDays(3)->toDateString(),
    ]);

    LeaveRequest::factory()->for($employee)->approved()->create([
        'starts_on' => $monday->subDays(14)->toDateString(),
        'ends_on' => $monday->subDays(10)->toDateString(),
    ]);

    LeaveRequest::factory()->for($employee)->approved()->create([
        'starts_on' => $monday->addDays(30)->toDateString(),
        'ends_on' => $monday->addDays(32)->toDateString(),
    ]);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->has('currentLeave', 1)
            ->where('currentLeave.0.user.name', 'Lena Janssens')
            ->where('currentLeave.0.type_label', 'Vakantie'));
});
