<?php

declare(strict_types=1);

use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

it('redirects to google for oauth', function (): void {
    Socialite::fake('google');

    $this->get('/auth/google/redirect')
        ->assertRedirect();
});

it('logs in an existing user matched by google_id', function (): void {
    $user = User::factory()->create([
        'google_id' => 'google-123',
        'email' => 'jan@example.com',
    ]);

    Socialite::fake('google', (new SocialiteUser)->map([
        'id' => 'google-123',
        'name' => 'Jan Jansen',
        'email' => 'jan@example.com',
    ]));

    $this->get('/auth/google/callback')
        ->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($user);
});

it('links google_id to an existing user with the same email', function (): void {
    $user = User::factory()->create([
        'google_id' => null,
        'email' => 'jan@example.com',
    ]);

    Socialite::fake('google', (new SocialiteUser)->map([
        'id' => 'google-new',
        'name' => 'Jan Jansen',
        'email' => 'jan@example.com',
    ]));

    $this->get('/auth/google/callback')
        ->assertRedirect(route('dashboard'));

    expect($user->fresh()->google_id)->toBe('google-new');
    $this->assertAuthenticatedAs($user);
});

it('creates a new employee when no matching user exists', function (): void {
    Socialite::fake('google', (new SocialiteUser)->map([
        'id' => 'google-brand-new',
        'name' => 'Nieuw Persoon',
        'email' => 'nieuw@example.com',
    ]));

    $this->get('/auth/google/callback')
        ->assertRedirect(route('dashboard'));

    $user = User::query()->where('email', 'nieuw@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->google_id)->toBe('google-brand-new')
        ->and($user->first_name)->toBe('Nieuw')
        ->and($user->last_name)->toBe('Persoon')
        ->and($user->password)->toBeNull();

    $this->assertAuthenticatedAs($user);
});

it('redirects to login with a message when google returns an error', function (): void {
    $this->get('/auth/google/callback?error=access_denied')
        ->assertRedirect(route('login'))
        ->assertSessionHas('authError');
});
