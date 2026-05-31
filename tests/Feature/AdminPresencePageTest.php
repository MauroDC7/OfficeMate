<?php

use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\Organization;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\User;
use Carbon\CarbonImmutable;

beforeEach(function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-19 10:00:00', 'UTC'));
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

it('shows organization presence on the teams page for admins', function () {
    $organization = Organization::factory()->create(['name' => 'Acme bvba']);
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
        'first_name' => 'Anna',
        'last_name' => 'Admin',
    ]);

    $onVacation = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'first_name' => 'Victor',
        'last_name' => 'Vakantie',
    ]);
    $sick = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'first_name' => 'Sanne',
        'last_name' => 'Sick',
    ]);
    $available = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'first_name' => 'Tom',
        'last_name' => 'Thuis',
    ]);

    $team = Team::factory()->for($organization)->create(['name' => 'Product']);
    TeamMembership::factory()->for($team)->for($onVacation)->approved()->create();
    TeamMembership::factory()->for($team)->for($available)->approved()->create();

    LeaveRequest::factory()->for($onVacation)->approved()->vacation()->create([
        'starts_on' => '2026-05-18',
        'ends_on' => '2026-05-22',
    ]);
    LeaveRequest::factory()->for($sick)->approved()->sick()->create([
        'starts_on' => '2026-05-19',
        'ends_on' => '2026-05-19',
    ]);

    $this->actingAs($admin)
        ->get(route('teams', ['tab' => 'presence']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('teams')
            ->where('initialTab', 'presence')
            ->where('presence.summary.in_office', 0)
            ->where('presence.summary.out_of_office', 2)
            ->where('presence.summary.vacation', 1)
            ->where('presence.summary.sick', 1)
            ->where('presence.summary.other_leave', 0)
            ->has('presence.employees', 4)
            ->where('presence.employees.0.status', 'out_of_office')
            ->where('presence.employees.1.status', 'sick')
            ->where('presence.employees.2.status', 'out_of_office')
            ->where('presence.employees.3.status', 'vacation'));
});

it('does not expose presence data to employees on the teams page', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($employee)
        ->get(route('teams', ['tab' => 'presence']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('teams')
            ->where('presence', null)
            ->where('initialTab', 'presence'));
});

it('redirects the legacy admin presence route to teams', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.presence'))
        ->assertRedirect(route('teams', ['tab' => 'presence']));
});

it('forbids employees from the legacy admin presence route', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($employee)
        ->get(route('admin.presence'))
        ->assertForbidden();
});

it('includes presence summary on the admin dashboard', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    LeaveRequest::factory()->for($employee)->approved()->vacation()->create([
        'starts_on' => '2026-05-19',
        'ends_on' => '2026-05-19',
    ]);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->where('presenceSummary.in_office', 0)
            ->where('presenceSummary.out_of_office', 1)
            ->where('presenceSummary.vacation', 1)
            ->where('presenceSummary.sick', 0)
            ->where('presenceSummary.other_leave', 0));
});
