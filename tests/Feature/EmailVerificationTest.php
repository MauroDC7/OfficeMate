<?php

declare(strict_types=1);

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

it('sends a verification email when registering', function (): void {
    Notification::fake();

    $this->post(route('register'), [
        'first_name' => 'Jan',
        'last_name' => 'Jansen',
        'email' => 'jan@example.com',
        'password' => 'WelkomOffice9!',
        'password_confirmation' => 'WelkomOffice9!',
        'privacy_policy_accepted' => '1',
    ])
        ->assertRedirect(route('verification.notice'));

    $user = User::query()->where('email', 'jan@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->email_verified_at)->toBeNull();

    $this->assertAuthenticatedAs($user);

    Notification::assertSentTo($user, VerifyEmailNotification::class);
});

it('blocks login for unverified users', function (): void {
    $user = User::factory()->unverified()->create([
        'password' => 'WelkomOffice9!',
    ]);

    $this->from(route('login'))
        ->post(route('login'), [
            'email' => $user->email,
            'password' => 'WelkomOffice9!',
        ])
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

it('verifies email via signed link and grants dashboard access', function (): void {
    $user = User::factory()->unverified()->create();

    $url = URL::temporarySignedRoute('verification.verify', now()->addHour(), [
        'id' => $user->id,
        'hash' => sha1($user->email),
    ]);

    $this->get($url)
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('status');

    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
    $this->assertAuthenticatedAs($user);
});

it('shows the verify email page', function (): void {
    $this->get(route('verification.notice'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('verify-email'));
});
