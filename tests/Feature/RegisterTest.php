<?php

declare(strict_types=1);

use App\Models\User;

it('shows the register page', function (): void {
    $this->get(route('register'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('register'));
});

it('registers a user with a valid password', function (): void {
    $this->post(route('register'), [
        'first_name' => 'Jan',
        'last_name' => 'Jansen',
        'email' => 'jan@example.com',
        'password' => 'WelkomOffice9!',
        'password_confirmation' => 'WelkomOffice9!',
        'role' => 'employee',
        'privacy_policy_accepted' => '1',
    ])
        ->assertRedirect(route('verification.notice'));

    $this->assertAuthenticated();

    $user = User::query()->where('email', 'jan@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->privacy_policy_accepted_at)->not->toBeNull();
});

it('requires accepting the privacy policy to register', function (): void {
    $this->from(route('register'))
        ->post(route('register'), [
            'first_name' => 'Jan',
            'last_name' => 'Jansen',
            'email' => 'jan@example.com',
            'password' => 'WelkomOffice9!',
            'password_confirmation' => 'WelkomOffice9!',
            'role' => 'employee',
        ])
        ->assertRedirect(route('register'))
        ->assertSessionHasErrors('privacy_policy_accepted');

    expect(User::query()->where('email', 'jan@example.com')->exists())->toBeFalse();
});

it('rejects a password that does not meet the requirements', function (): void {
    $this->from(route('register'))
        ->post(route('register'), [
            'first_name' => 'Jan',
            'last_name' => 'Jansen',
            'email' => 'jan@example.com',
            'password' => 'kort1',
            'password_confirmation' => 'kort1',
            'role' => 'employee',
            'privacy_policy_accepted' => '1',
        ])
        ->assertRedirect(route('register'))
        ->assertSessionHasErrors('password');

    expect(User::query()->where('email', 'jan@example.com')->exists())->toBeFalse();
});
