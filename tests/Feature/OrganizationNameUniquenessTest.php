<?php

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('forbids renaming to an existing organization name', function () {
    Organization::factory()->create(['name' => 'Proximus']);
    $telenet = Organization::factory()->create(['name' => 'Telenet']);
    $admin = User::factory()->admin($telenet)->create();

    $this->actingAs($admin)
        ->from(route('teams'))
        ->patch(route('teams.organization.update'), [
            'name' => 'Proximus',
        ])
        ->assertRedirect(route('teams'))
        ->assertSessionHasErrors('name');

    expect($telenet->fresh()->name)->toBe('Telenet');
});

it('allows renaming when keeping the same name', function () {
    $organization = Organization::factory()->create(['name' => 'Proximus']);
    $admin = User::factory()->admin($organization)->create();

    $this->actingAs($admin)
        ->patch(route('teams.organization.update'), [
            'name' => 'Proximus',
        ])
        ->assertRedirect(route('teams'));

    expect($organization->fresh()->name)->toBe('Proximus');
});

it('treats organization names as unique case insensitively', function () {
    Organization::factory()->create(['name' => 'Proximus']);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('teams.organization.start-new'), [
            'name' => 'PROXIMUS',
            'confirm' => '1',
        ])
        ->assertSessionHasErrors('name');
});

it('forbids creating a first organization with a taken name', function () {
    Organization::factory()->create(['name' => 'Proximus']);
    $user = User::factory()->create(['organization_id' => null]);

    $this->actingAs($user)
        ->post(route('settings.organization.store'), [
            'name' => 'Proximus',
        ])
        ->assertSessionHasErrors('name');

    expect($user->fresh()->organization_id)->toBeNull();
});
