<?php

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

it('shows the forgot password page', function () {
    $this->get(route('password.request'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('forgot-password'));
});

it('sends a password reset notification for a known email', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post(route('password.email'), ['email' => $user->email])
        ->assertRedirect()
        ->assertSessionHas('status');

    Notification::assertSentTo($user, ResetPasswordNotification::class);
});

it('shows the same success message for an unknown email', function () {
    Notification::fake();

    $this->post(route('password.email'), ['email' => 'onbekend@example.com'])
        ->assertRedirect()
        ->assertSessionHas('status');

    Notification::assertNothingSent();
});

it('resets the password with a valid token', function () {
    $user = User::factory()->create([
        'password' => Hash::make('oud-wachtwoord'),
    ]);

    $token = Password::createToken($user);

    $this->get(route('password.reset', ['token' => $token, 'email' => $user->email]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('reset-password')
            ->where('email', $user->email)
            ->where('token', $token));

    $this->post(route('password.update'), [
        'token' => $token,
        'email' => $user->email,
        'password' => 'nieuw-wachtwoord-9',
        'password_confirmation' => 'nieuw-wachtwoord-9',
    ])
        ->assertRedirect(route('login'))
        ->assertSessionHas('status');

    expect(Hash::check('nieuw-wachtwoord-9', $user->fresh()->password))->toBeTrue();
});

it('rejects an invalid password reset token', function () {
    $user = User::factory()->create();

    $this->from(route('password.reset', ['token' => 'ongeldig', 'email' => $user->email]))
        ->post(route('password.update'), [
            'token' => 'ongeldig',
            'email' => $user->email,
            'password' => 'nieuw-wachtwoord-9',
            'password_confirmation' => 'nieuw-wachtwoord-9',
        ])
        ->assertRedirect(route('password.reset', ['token' => 'ongeldig', 'email' => $user->email]))
        ->assertSessionHasErrors('email');
});
