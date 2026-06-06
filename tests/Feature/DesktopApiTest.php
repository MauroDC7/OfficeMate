<?php

declare(strict_types=1);

use App\Models\DesktopActivity;
use App\Models\User;

it('geeft een sanctum-token terug bij correcte credentials', function (): void {
    $user = User::factory()->create([
        'email' => 'tracker@example.com',
        'password' => bcrypt('geheim123'),
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'tracker@example.com',
        'password' => 'geheim123',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['access_token', 'user' => ['id'], 'tracker_tracking_enabled'])
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('tracker_tracking_enabled', true);

    expect($user->fresh()->tokens)->toHaveCount(1);
});

it('weigert ongeldige credentials met 401', function (): void {
    User::factory()->create([
        'email' => 'tracker@example.com',
        'password' => bcrypt('geheim123'),
    ]);

    $this->postJson('/api/login', [
        'email' => 'tracker@example.com',
        'password' => 'fout',
    ])->assertStatus(401)
        ->assertJsonStructure(['message']);
});

it('valideert verplichte velden bij login met 422', function (): void {
    $this->postJson('/api/login', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email', 'password']);
});

it('weigert activity zonder bearer-token', function (): void {
    $this->postJson('/api/activity', ['activities' => []])
        ->assertStatus(401);
});

it('bewaart activities voor de ingelogde tracker-gebruiker', function (): void {
    $user = User::factory()->create();
    $token = $user->createToken('test')->plainTextToken;

    $payload = [
        'activities' => [
            [
                'app_name' => 'Code.exe',
                'window_title' => 'tracker',
                'browser_url' => 'https://github.com',
                'browser_domain' => 'github.com',
                'browser_tab_title' => 'GitHub',
                'started_at' => '2026-05-15T14:00:00.000Z',
                'ended_at' => '2026-05-15T14:05:00.000Z',
                'duration_seconds' => 300,
            ],
            [
                'app_name' => 'Chrome.exe',
                'window_title' => 'Inbox',
                'browser_url' => null,
                'browser_domain' => null,
                'browser_tab_title' => null,
                'started_at' => '2026-05-15T14:05:00.000Z',
                'ended_at' => '2026-05-15T14:10:00.000Z',
                'duration_seconds' => 300,
            ],
        ],
    ];

    $this->withHeaders(['Authorization' => "Bearer {$token}"])
        ->postJson('/api/activity', $payload)
        ->assertNoContent();

    expect(DesktopActivity::query()->where('user_id', $user->id)->count())->toBe(2);

    $first = DesktopActivity::query()->where('app_name', 'Code.exe')->firstOrFail();
    expect($first->user_id)->toBe($user->id)
        ->and($first->browser_domain)->toBe('github.com')
        ->and($first->duration_seconds)->toBe(300);
});

it('negeert user_id uit de request body en gebruikt het token', function (): void {
    $owner = User::factory()->create();
    $somebodyElse = User::factory()->create();
    $token = $owner->createToken('test')->plainTextToken;

    $this->withHeaders(['Authorization' => "Bearer {$token}"])
        ->postJson('/api/activity', [
            'activities' => [[
                'user_id' => $somebodyElse->id,
                'app_name' => 'Code.exe',
                'window_title' => 'tracker',
                'started_at' => '2026-05-15T14:00:00.000Z',
                'ended_at' => '2026-05-15T14:05:00.000Z',
                'duration_seconds' => 300,
            ]],
        ])
        ->assertNoContent();

    $row = DesktopActivity::query()->firstOrFail();
    expect($row->user_id)->toBe($owner->id);
});

it('valideert activity payload met 422', function (): void {
    $user = User::factory()->create();
    $token = $user->createToken('test')->plainTextToken;

    $this->withHeaders(['Authorization' => "Bearer {$token}"])
        ->postJson('/api/activity', [
            'activities' => [[
                'window_title' => 'tracker',
                'started_at' => '2026-05-15T14:00:00.000Z',
                'ended_at' => '2026-05-15T14:05:00.000Z',
                'duration_seconds' => -1,
            ]],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'activities.0.app_name',
            'activities.0.duration_seconds',
        ]);
});

it('weigert activity waar ended_at vóór started_at ligt', function (): void {
    $user = User::factory()->create();
    $token = $user->createToken('test')->plainTextToken;

    $this->withHeaders(['Authorization' => "Bearer {$token}"])
        ->postJson('/api/activity', [
            'activities' => [[
                'app_name' => 'Code.exe',
                'window_title' => 'tracker',
                'started_at' => '2026-05-15T14:05:00.000Z',
                'ended_at' => '2026-05-15T14:00:00.000Z',
                'duration_seconds' => 300,
            ]],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['activities.0.ended_at']);
});

it('revokes vorige tracker-tokens van dezelfde naam bij een nieuwe login', function (): void {
    $user = User::factory()->create([
        'email' => 'tracker@example.com',
        'password' => bcrypt('geheim123'),
    ]);

    $user->createToken('officemate-tracker');
    $user->createToken('andere-app');

    expect($user->fresh()->tokens)->toHaveCount(2);

    $this->postJson('/api/login', [
        'email' => 'tracker@example.com',
        'password' => 'geheim123',
    ])->assertOk();

    $tokens = $user->fresh()->tokens;
    expect($tokens)->toHaveCount(2)
        ->and($tokens->pluck('name')->sort()->values()->all())->toBe(['andere-app', 'officemate-tracker']);
});
