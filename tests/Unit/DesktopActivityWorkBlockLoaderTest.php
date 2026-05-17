<?php

use App\Models\DesktopActivity;
use App\Models\User;
use App\Services\DesktopActivityWorkBlockLoader;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Config;

beforeEach(function () {
    Config::set('services.timesheets.timezone', 'UTC');
});

it('builds work blocks from desktop activities for the authenticated user only', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    DesktopActivity::factory()->for($user)->create([
        'app_name' => 'Cursor',
        'window_title' => 'OfficeMate',
        'started_at' => '2026-05-11 09:00:00',
        'ended_at' => '2026-05-11 10:00:00',
        'duration_seconds' => 3600,
    ]);

    DesktopActivity::factory()->for($other)->create([
        'app_name' => 'Cursor',
        'window_title' => 'Andere user',
        'started_at' => '2026-05-11 09:00:00',
        'ended_at' => '2026-05-11 10:00:00',
        'duration_seconds' => 3600,
    ]);

    $blocks = app(DesktopActivityWorkBlockLoader::class)
        ->loadWorkBlocksForDay($user, CarbonImmutable::parse('2026-05-11'));

    expect($blocks)->toHaveCount(1)
        ->and($blocks[0]['worked_on'])->toBe('2026-05-11')
        ->and($blocks[0]['applications'][0]['application'])->toBe('Cursor');
});

it('ignores loginwindow but keeps blocks of at least two minutes', function () {
    $user = User::factory()->create();

    DesktopActivity::factory()->for($user)->create([
        'app_name' => 'loginwindow',
        'window_title' => 'Locked',
        'started_at' => '2026-05-11 08:00:00',
        'ended_at' => '2026-05-11 09:00:00',
        'duration_seconds' => 3600,
    ]);

    DesktopActivity::factory()->for($user)->create([
        'app_name' => 'Cursor',
        'window_title' => 'Kort',
        'started_at' => '2026-05-11 10:00:00',
        'ended_at' => '2026-05-11 10:02:00',
        'duration_seconds' => 120,
    ]);

    $blocks = app(DesktopActivityWorkBlockLoader::class)
        ->loadWorkBlocksForDay($user, CarbonImmutable::parse('2026-05-11'));

    expect($blocks)->toHaveCount(1)
        ->and($blocks[0]['applications'][0]['application'])->toBe('Cursor');
});

it('prefers browser tab title and domain in window title', function () {
    $user = User::factory()->create();

    DesktopActivity::factory()->for($user)->create([
        'app_name' => 'Google Chrome',
        'window_title' => 'Chrome',
        'browser_tab_title' => 'GitHub — tracker',
        'browser_domain' => 'github.com',
        'started_at' => '2026-05-11 14:00:00',
        'ended_at' => '2026-05-11 14:30:00',
        'duration_seconds' => 1800,
    ]);

    $blocks = app(DesktopActivityWorkBlockLoader::class)
        ->loadWorkBlocksForDay($user, CarbonImmutable::parse('2026-05-11'));

    expect($blocks)->toHaveCount(1)
        ->and($blocks[0]['applications'][0]['window_title'])->toContain('GitHub')
        ->and($blocks[0]['applications'][0]['window_title'])->toContain('github.com');
});
