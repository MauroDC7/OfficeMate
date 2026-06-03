<?php

use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\Project;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('lets an admin start a new organization with a clean teams overview', function () {
    $oldOrganization = Organization::factory()->create(['name' => 'Telenet']);
    $admin = User::factory()->admin($oldOrganization)->create();
    Team::factory()->for($oldOrganization)->create(['name' => 'Support']);
    Project::factory()->for($oldOrganization)->create(['name' => 'Klantportaal']);

    $this->actingAs($admin)
        ->post(route('teams.organization.start-new'), [
            'name' => 'Nieuw Bedrijf BV',
            'confirm' => '1',
        ])
        ->assertRedirect(route('teams'));

    $admin->refresh();

    expect($admin->organization_id)->not->toBe($oldOrganization->id)
        ->and(Organization::query()->find($admin->organization_id)?->name)->toBe('Nieuw Bedrijf BV')
        ->and($oldOrganization->teams()->count())->toBe(1)
        ->and(Project::query()->where('organization_id', $oldOrganization->id)->count())->toBe(1);

    $this->actingAs($admin)
        ->get(route('teams'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('organization.name', 'Nieuw Bedrijf BV')
            ->has('teamCards', 0));
});

it('keeps the old organization available for remaining members', function () {
    $oldOrganization = Organization::factory()->create(['name' => 'Telenet']);
    $admin = User::factory()->admin($oldOrganization)->create();
    $otherAdmin = User::factory()->admin($oldOrganization)->create();
    $team = Team::factory()->for($oldOrganization)->create(['name' => 'Support']);

    $this->actingAs($admin)
        ->post(route('teams.organization.start-new'), [
            'name' => 'Side Project BV',
            'confirm' => '1',
        ])
        ->assertRedirect(route('teams'));

    $this->actingAs($otherAdmin)
        ->get(route('teams'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('organization.name', 'Telenet')
            ->has('teamCards', 1)
            ->where('teamCards.0.name', 'Support'));
});

it('forbids starting a new organization when you are the only admin with other members', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->admin($organization)->create();
    User::factory()->forOrganization($organization)->create(['role' => UserRole::Employee]);

    $this->actingAs($admin)
        ->from(route('teams'))
        ->post(route('teams.organization.start-new'), [
            'name' => 'Nieuw Bedrijf BV',
            'confirm' => '1',
        ])
        ->assertRedirect(route('teams'))
        ->assertSessionHasErrors('name');

    expect($admin->fresh()->organization_id)->toBe($organization->id);
});

it('requires confirmation before starting a new organization', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('teams.organization.start-new'), [
            'name' => 'Nieuw Bedrijf BV',
        ])
        ->assertSessionHasErrors('confirm');
});
