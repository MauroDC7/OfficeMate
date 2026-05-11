<?php

use App\Models\DesktopActivity;
use App\Models\User;

it('issues a bearer token on POST /api/login', function () {
    $user = User::factory()->create([
        'email' => 'tracker@example.com',
        'password' => 'secret-password',
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'tracker@example.com',
        'password' => 'secret-password',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'token',
            'access_token',
            'user_id',
            'user' => ['id'],
            'data' => ['token'],
        ]);

    expect($response->json('token'))->toBeString()->not->toBeEmpty()
        ->and($response->json('token'))->toBe($response->json('access_token'))
        ->and($response->json('data.token'))->toBe($response->json('token'))
        ->and($response->json('user_id'))->toBe($user->id);
});

it('returns 401 for invalid login credentials', function () {
    User::factory()->create([
        'email' => 'tracker@example.com',
        'password' => 'correct-password',
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'tracker@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertUnauthorized()
        ->assertJsonPath('message', 'De combinatie van e-mailadres en wachtwoord is niet juist.');
});

it('stores activities for the authenticated user on POST /api/activity', function () {
    $user = User::factory()->create();

    $login = $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $token = $login->json('token');

    $started = '2026-05-11T10:00:00Z';
    $ended = '2026-05-11T10:05:00Z';

    $response = $this->postJson(
        '/api/activity',
        [
            'activities' => [
                [
                    'app_name' => 'Cursor',
                    'window_title' => 'auth-page.tsx',
                    'browser_url' => null,
                    'browser_domain' => null,
                    'browser_tab_title' => null,
                    'started_at' => $started,
                    'ended_at' => $ended,
                    'duration_seconds' => 300,
                ],
            ],
        ],
        [
            'Authorization' => 'Bearer '.$token,
            'Accept' => 'application/json',
        ]
    );

    $response->assertNoContent();

    expect(DesktopActivity::query()->count())->toBe(1);

    $activity = DesktopActivity::query()->first();
    expect($activity)->not->toBeNull()
        ->and($activity->user_id)->toBe($user->id)
        ->and($activity->app_name)->toBe('Cursor')
        ->and($activity->window_title)->toBe('auth-page.tsx')
        ->and($activity->duration_seconds)->toBe(300);
});

it('rejects activity sync without a bearer token', function () {
    $response = $this->postJson('/api/activity', [
        'activities' => [
            [
                'app_name' => 'X',
                'window_title' => 'Y',
                'browser_url' => null,
                'browser_domain' => null,
                'browser_tab_title' => null,
                'started_at' => '2026-05-11T10:00:00Z',
                'ended_at' => '2026-05-11T10:01:00Z',
                'duration_seconds' => 60,
            ],
        ],
    ]);

    $response->assertUnauthorized();
});
