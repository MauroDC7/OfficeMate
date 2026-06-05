<?php

use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\TimesheetEntry;
use App\Models\User;
use Carbon\CarbonImmutable;

beforeEach(function () {
    $this->withoutVite();
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-02 10:00:00', 'UTC'));
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

function timesheetReportAdmin(): array
{
    $organization = Organization::factory()->create(['name' => 'Acme BV']);
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);

    return [$organization, $admin];
}

it('forbids non-admins from viewing the timesheet report', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($employee)
        ->get(route('admin.timesheetReport'))
        ->assertForbidden();
});

it('shows the admin timesheet report page with filtered rows', function () {
    [$organization, $admin] = timesheetReportAdmin();

    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'first_name' => 'Lisa',
        'last_name' => 'Janssen',
    ]);

    $otherEmployee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $project = Project::factory()->for($organization)->create(['name' => 'Website redesign']);

    TimesheetEntry::factory()->for($employee)->for($project)->create([
        'worked_on' => '2026-06-02',
        'title' => 'Frontend werk',
        'start_minutes' => 9 * 60,
        'end_minutes' => 12 * 60,
    ]);

    TimesheetEntry::factory()->for($otherEmployee)->create([
        'worked_on' => '2026-06-02',
        'start_minutes' => 10 * 60,
        'end_minutes' => 11 * 60,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.timesheetReport', [
            'starts_on' => '2026-06-02',
            'ends_on' => '2026-06-02',
            'user_id' => $employee->id,
            'project_id' => $project->id,
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/timesheetReport')
            ->where('organizationName', 'Acme BV')
            ->where('summary.entry_count', 1)
            ->where('summary.total_minutes', 180)
            ->where('summary.employee_count', 1)
            ->has('rows', 1)
            ->where('rows.0.employee_name', 'Lisa Janssen')
            ->where('rows.0.title', 'Frontend werk')
            ->where('rows.0.project_name', 'Website redesign'));
});

it('filters timesheet report rows by team membership', function () {
    [$organization, $admin] = timesheetReportAdmin();

    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $otherEmployee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $team = Team::factory()->for($organization)->create();

    TeamMembership::factory()->for($team)->for($employee)->approved()->create();

    TimesheetEntry::factory()->for($employee)->create([
        'worked_on' => '2026-06-02',
        'start_minutes' => 9 * 60,
        'end_minutes' => 10 * 60,
    ]);

    TimesheetEntry::factory()->for($otherEmployee)->create([
        'worked_on' => '2026-06-02',
        'start_minutes' => 9 * 60,
        'end_minutes' => 11 * 60,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.timesheetReport', [
            'starts_on' => '2026-06-02',
            'ends_on' => '2026-06-02',
            'team_id' => $team->id,
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('summary.entry_count', 1)
            ->where('summary.employee_count', 1));
});

it('exports filtered timesheet rows as csv', function () {
    [$organization, $admin] = timesheetReportAdmin();

    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'first_name' => 'Tom',
        'last_name' => 'Peeters',
        'email' => 'tom@example.com',
    ]);

    TimesheetEntry::factory()->for($employee)->create([
        'worked_on' => '2026-06-02',
        'title' => 'Support tickets',
        'client_name' => 'Klant X',
        'start_minutes' => 8 * 60,
        'end_minutes' => 10 * 60,
    ]);

    $response = $this->actingAs($admin)
        ->get(route('admin.timesheetReport.export', [
            'starts_on' => '2026-06-02',
            'ends_on' => '2026-06-02',
            'user_id' => $employee->id,
            'format' => 'csv',
        ]));

    $response->assertOk()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8');

    $content = $response->streamedContent();

    expect($content)
        ->toContain('Medewerker')
        ->toContain('Tom Peeters')
        ->toContain('tom@example.com')
        ->toContain('Support tickets')
        ->toContain('Klant X');
});

it('rejects export filters outside the organization', function () {
    [$organization, $admin] = timesheetReportAdmin();
    $otherOrganization = Organization::factory()->create();
    $foreignEmployee = User::factory()->forOrganization($otherOrganization)->create();

    $this->actingAs($admin)
        ->get(route('admin.timesheetReport.export', [
            'starts_on' => '2026-06-02',
            'ends_on' => '2026-06-02',
            'user_id' => $foreignEmployee->id,
            'format' => 'csv',
        ]))
        ->assertSessionHasErrors('user_id');
});

it('rejects unsupported export formats', function () {
    [, $admin] = timesheetReportAdmin();

    $this->actingAs($admin)
        ->get(route('admin.timesheetReport.export', [
            'starts_on' => '2026-06-02',
            'ends_on' => '2026-06-02',
            'format' => 'pdf',
        ]))
        ->assertSessionHasErrors('format');
});
