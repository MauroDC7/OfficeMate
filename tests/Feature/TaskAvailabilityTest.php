<?php

use App\Enums\TaskAvailability;
use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows task availability on the projects page when linked to an organization', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'task_availability' => TaskAvailability::OnTask,
    ]);

    $this->actingAs($employee)
        ->get(route('projects'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('projects')
            ->where('taskAvailability', 'on_task')
            ->has('taskAvailabilityOptions', 2));
});

it('lets employees update their task availability', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'task_availability' => TaskAvailability::OpenForTasks,
    ]);

    $this->actingAs($employee)
        ->from(route('dashboard'))
        ->patch(route('dashboard.task-availability.update'), [
            'task_availability' => TaskAvailability::OnTask->value,
        ])
        ->assertRedirect(route('dashboard'));

    expect($employee->fresh()->task_availability)->toBe(TaskAvailability::OnTask);
});

it('forbids updating task availability without an organization', function () {
    $employee = User::factory()->create([
        'role' => UserRole::Employee,
        'organization_id' => null,
    ]);

    $this->actingAs($employee)
        ->patch(route('dashboard.task-availability.update'), [
            'task_availability' => TaskAvailability::OnTask->value,
        ])
        ->assertForbidden();
});

it('exposes task availability on the people tab for admins', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->admin($organization)->create();
    User::factory()->forOrganization($organization)->create([
        'task_availability' => TaskAvailability::OpenForTasks,
    ]);

    $this->actingAs($admin)
        ->get(route('teams', ['tab' => 'people']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('people.employees.1.task_availability', 'open_for_tasks')
            ->where('people.employees.1.task_availability_label', 'Open for tasks'));
});
