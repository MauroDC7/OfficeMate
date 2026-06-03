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
        ->get(route('teams', ['tab' => 'people']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('teams')
            ->where('initialTab', 'people')
            ->where('people.summary.in_office', 0)
            ->where('people.summary.out_of_office', 2)
            ->where('people.summary.vacation', 1)
            ->where('people.summary.sick', 1)
            ->where('people.summary.other_leave', 0)
            ->has('people.employees', 4)
            ->where('people.employees.0.status', 'out_of_office')
            ->where('people.employees.0.role', 'admin')
            ->where('people.employees.1.status', 'sick')
            ->where('people.employees.2.status', 'out_of_office')
            ->where('people.employees.3.status', 'vacation'));
});

it('does not expose presence data to employees on the teams page', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($employee)
        ->get(route('teams', ['tab' => 'people']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('teams')
            ->where('people', null)
            ->where('initialTab', 'people'));
});

it('opens the people tab when using the legacy presence query parameter', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);

    $this->actingAs($admin)
        ->get(route('teams', ['tab' => 'presence']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('initialTab', 'people'));
});

it('redirects the legacy admin presence route to teams', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.presence'))
        ->assertRedirect(route('teams', ['tab' => 'people']));
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
