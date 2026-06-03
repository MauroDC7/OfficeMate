<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\DesktopActivity;
use App\Models\Organization;
use App\Models\User;
use App\Services\DesktopActivityWorkBlockLoader;
use Carbon\CarbonImmutable;
use Inertia\Testing\AssertableInertia as Assert;

it('shows tracker preferences on settings', function () {
    $employee = User::factory()->forOrganization(Organization::factory()->create())->create([
        'role' => UserRole::Employee,
        'tracker_use_ai_for_proposals' => false,
        'tracker_blocklist' => ['spotify'],
    ]);

    $this->actingAs($employee)
        ->get(route('settings'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('tracker.use_ai_for_proposals', false)
            ->where('tracker.blocklist', ['spotify']));
});

it('updates tracker preferences', function () {
    $employee = User::factory()->forOrganization(Organization::factory()->create())->create([
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($employee)
        ->patch(route('settings.tracker.update'), [
            'tracker_use_ai_for_proposals' => true,
            'tracker_tracking_enabled' => false,
            'tracker_blocklist' => ['whatsapp', 'netflix'],
        ])
        ->assertRedirect(route('settings').'#tracker');

    $employee->refresh();

    expect($employee->tracker_use_ai_for_proposals)->toBeTrue()
        ->and($employee->tracker_tracking_enabled)->toBeFalse()
        ->and($employee->tracker_blocklist)->toBe(['whatsapp', 'netflix']);
});

it('rejects desktop activity when tracking is disabled in preferences', function () {
    $user = User::factory()->create([
        'tracker_tracking_enabled' => false,
    ]);
    $token = $user->createToken('test')->plainTextToken;

    $this->withHeaders(['Authorization' => "Bearer {$token}"])
        ->postJson('/api/activity', [
            'activities' => [
                [
                    'app_name' => 'Code.exe',
                    'window_title' => 'test',
                    'started_at' => '2026-05-15T14:00:00.000Z',
                    'ended_at' => '2026-05-15T14:05:00.000Z',
                    'duration_seconds' => 300,
                ],
            ],
        ])
        ->assertNoContent();

    expect(DesktopActivity::query()->where('user_id', $user->id)->count())->toBe(0);
});

it('does not store blocklisted activities from the desktop api', function () {
    $user = User::factory()->create([
        'tracker_blocklist' => ['spotify'],
    ]);
    $token = $user->createToken('test')->plainTextToken;

    $this->withHeaders(['Authorization' => "Bearer {$token}"])
        ->postJson('/api/activity', [
            'activities' => [
                [
                    'app_name' => 'Spotify.exe',
                    'window_title' => 'Discover Weekly',
                    'started_at' => '2026-06-02T09:00:00.000Z',
                    'ended_at' => '2026-06-02T09:30:00.000Z',
                    'duration_seconds' => 1800,
                ],
                [
                    'app_name' => 'Code.exe',
                    'window_title' => 'project.ts',
                    'started_at' => '2026-06-02T10:00:00.000Z',
                    'ended_at' => '2026-06-02T11:00:00.000Z',
                    'duration_seconds' => 3600,
                ],
            ],
        ])
        ->assertNoContent();

    expect(DesktopActivity::query()->where('user_id', $user->id)->count())->toBe(1)
        ->and(DesktopActivity::query()->where('app_name', 'Code.exe')->exists())->toBeTrue();
});

it('excludes blocklisted desktop activities from work blocks', function () {
    $user = User::factory()->create([
        'tracker_blocklist' => ['spotify'],
    ]);

    DesktopActivity::factory()->for($user)->create([
        'app_name' => 'Spotify.exe',
        'window_title' => 'Discover Weekly',
        'started_at' => CarbonImmutable::parse('2026-06-02 09:00:00', 'UTC'),
        'ended_at' => CarbonImmutable::parse('2026-06-02 09:30:00', 'UTC'),
        'duration_seconds' => 1800,
    ]);

    DesktopActivity::factory()->for($user)->create([
        'app_name' => 'Code.exe',
        'window_title' => 'project.ts',
        'started_at' => CarbonImmutable::parse('2026-06-02 10:00:00', 'UTC'),
        'ended_at' => CarbonImmutable::parse('2026-06-02 11:00:00', 'UTC'),
        'duration_seconds' => 3600,
    ]);

    $blocks = app(DesktopActivityWorkBlockLoader::class)->loadWorkBlocksForDay(
        $user,
        CarbonImmutable::parse('2026-06-02', 'UTC'),
        'UTC',
    );

    expect($blocks)->toHaveCount(1)
        ->and($blocks[0]['applications'][0]['application'])->toBe('Code.exe');
});

it('marks tracker as active when recent activity was received', function () {
    $employee = User::factory()->forOrganization(Organization::factory()->create())->create();
    $employee->createToken('officemate-tracker');

    DesktopActivity::factory()->for($employee)->create([
        'ended_at' => now()->subMinutes(5),
    ]);

    $this->actingAs($employee)
        ->get(route('settings'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('tracker.is_connected', true)
            ->where('tracker.is_active', true));
});
