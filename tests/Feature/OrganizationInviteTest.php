<?php

use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\OrganizationInvite;
use App\Models\User;
use App\Notifications\OrganizationInviteNotification;
use App\Services\OrganizationContext;
use App\Services\OrganizationInviteService;
use Illuminate\Support\Facades\Notification;

it('lets admins send an email invite', function () {
    Notification::fake();

    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $organization = app(OrganizationContext::class)->forUser($admin);

    $this->actingAs($admin)
        ->post(route('teams.organization-invites.store'), [
            'email' => 'nieuw@example.com',
        ])
        ->assertRedirect(route('teams'))
        ->assertSessionHas('status');

    $this->assertDatabaseHas('organization_invites', [
        'organization_id' => $organization->id,
        'email' => 'nieuw@example.com',
        'created_by_user_id' => $admin->id,
        'redeemed_at' => null,
    ]);

    Notification::assertSentOnDemand(OrganizationInviteNotification::class);
});

it('accepts an invite when a new user registers after opening the link', function () {
    Notification::fake();

    $organization = Organization::factory()->create(['name' => 'Acme BV']);
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);

    app(OrganizationInviteService::class)->send($organization, $admin, 'medewerker@example.com');

    $invite = OrganizationInvite::query()->where('email', 'medewerker@example.com')->first();
    expect($invite)->not->toBeNull();

    $this->get(route('organization-invite.show', ['token' => $invite->token]))
        ->assertRedirect(route('register'))
        ->assertSessionHas('organization_invite_token');

    expect(session('organization_invite_token'))->toBe($invite->token);

    $this->post(route('register'), [
        'first_name' => 'Jan',
        'last_name' => 'Jansen',
        'email' => 'medewerker@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'privacy_policy_accepted' => '1',
    ])->assertRedirect(route('verification.notice'));

    $user = User::query()->where('email', 'medewerker@example.com')->first();

    expect($user?->organization_id)->toBe($organization->id);
    expect($invite->fresh()->redeemed_at)->not->toBeNull();
    expect($invite->fresh()->redeemed_by_user_id)->toBe($user?->id);
});

it('applies organization employment defaults when an invite is accepted', function () {
    Notification::fake();

    $organization = Organization::factory()->create([
        'default_weekly_work_hours' => 36,
        'default_annual_leave_days' => 22,
    ]);
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $employee = User::factory()->create([
        'role' => UserRole::Employee,
        'email' => 'nieuw@example.com',
    ]);

    app(OrganizationInviteService::class)->send($organization, $admin, 'nieuw@example.com');

    $invite = OrganizationInvite::query()->where('email', 'nieuw@example.com')->firstOrFail();

    app(OrganizationInviteService::class)->accept($employee, $invite->token);

    expect($employee->fresh())
        ->weekly_work_hours->toBe(36)
        ->annual_leave_days->toBe(22)
        ->employment_profile_id->toBeNull()
        ->organization_joined_at->not->toBeNull()
        ->employment_setup_completed_at->toBeNull();
});

it('accepts an invite when an existing user logs in after opening the link', function () {
    Notification::fake();

    $organization = Organization::factory()->create(['name' => 'Acme BV']);
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $employee = User::factory()->create([
        'role' => UserRole::Employee,
        'email' => 'bestaand@example.com',
        'password' => 'Password123!',
    ]);

    app(OrganizationInviteService::class)->send($organization, $admin, 'bestaand@example.com');

    $invite = OrganizationInvite::query()->where('email', 'bestaand@example.com')->firstOrFail();

    $this->get(route('organization-invite.show', ['token' => $invite->token]))
        ->assertRedirect(route('login'))
        ->assertSessionHas('organization_invite_token', $invite->token);

    $this->post(route('login'), [
        'email' => 'bestaand@example.com',
        'password' => 'Password123!',
    ])->assertRedirect(route('dashboard'));

    expect($employee->fresh()->organization_id)->toBe($organization->id);
});

it('rejects an invite that was already used', function () {
    Notification::fake();

    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $first = User::factory()->create([
        'role' => UserRole::Employee,
        'email' => 'tweede@example.com',
    ]);
    $second = User::factory()->create(['role' => UserRole::Employee]);

    app(OrganizationInviteService::class)->send($organization, $admin, 'tweede@example.com');

    $invite = OrganizationInvite::query()->where('email', 'tweede@example.com')->firstOrFail();
    $token = $invite->token;

    app(OrganizationInviteService::class)->accept($first, $token);

    $this->actingAs($second)
        ->get(route('organization-invite.show', ['token' => $token]))
        ->assertRedirect(route('login'))
        ->assertSessionHas('authError');
});

it('forbids employees from sending invites', function () {
    $employee = User::factory()->create(['role' => UserRole::Employee]);

    $this->actingAs($employee)
        ->post(route('teams.organization-invites.store'), [
            'email' => 'iemand@example.com',
        ])
        ->assertForbidden();
});

it('shows awaiting invite message for employees without an organization', function () {
    $employee = User::factory()->create(['role' => UserRole::Employee]);

    $this->actingAs($employee)
        ->get(route('settings'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('awaitingOrganizationInvite', true));

    $this->actingAs($employee)
        ->get(route('teams'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('awaitingOrganizationInvite', true)
            ->where('organization', null));
});
