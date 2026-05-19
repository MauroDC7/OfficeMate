<?php

use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\OrganizationInvite;
use App\Models\User;
use App\Services\OrganizationContext;
use App\Services\OrganizationInviteService;

it('lets admins generate a one-time invite code', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $organization = app(OrganizationContext::class)->forUser($admin);

    $this->actingAs($admin)
        ->post(route('settings.organization-invites.store'))
        ->assertRedirect(route('settings'))
        ->assertSessionHas('organizationInviteCode');

    $code = session('organizationInviteCode');

    expect($code)->toBeString()->toHaveLength(8);

    $this->assertDatabaseHas('organization_invites', [
        'organization_id' => $organization->id,
        'code' => $code,
        'created_by_user_id' => $admin->id,
        'redeemed_at' => null,
    ]);
});

it('lets employees redeem a valid invite code once', function () {
    $organization = Organization::factory()->create(['name' => 'Acme BV']);
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $employee = User::factory()->create(['role' => UserRole::Employee]);

    $code = app(OrganizationInviteService::class)->generate($organization, $admin);

    $this->actingAs($employee)
        ->post(route('settings.organization-invite.redeem'), ['code' => $code])
        ->assertRedirect(route('settings'))
        ->assertSessionHas('status');

    expect($employee->fresh()->organization_id)->toBe($organization->id);

    $invite = OrganizationInvite::query()->where('code', $code)->first();
    expect($invite?->redeemed_at)->not->toBeNull();
    expect($invite?->redeemed_by_user_id)->toBe($employee->id);
});

it('rejects a code that was already used', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $first = User::factory()->create(['role' => UserRole::Employee]);
    $second = User::factory()->create(['role' => UserRole::Employee]);

    $code = app(OrganizationInviteService::class)->generate($organization, $admin);

    app(OrganizationInviteService::class)->redeem($first, $code);

    $this->actingAs($second)
        ->from(route('settings'))
        ->post(route('settings.organization-invite.redeem'), ['code' => $code])
        ->assertRedirect(route('settings'))
        ->assertSessionHasErrors('code');
});

it('forbids employees from generating invite codes', function () {
    $employee = User::factory()->create(['role' => UserRole::Employee]);

    $this->actingAs($employee)
        ->post(route('settings.organization-invites.store'))
        ->assertForbidden();
});

it('shows redeem form for employees without an organization', function () {
    $employee = User::factory()->create(['role' => UserRole::Employee]);

    $this->actingAs($employee)
        ->get(route('settings'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('canRedeemInvite', true)
            ->where('organization', null));
});
