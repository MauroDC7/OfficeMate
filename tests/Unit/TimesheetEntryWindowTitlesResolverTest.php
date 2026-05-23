<?php

use App\Models\DesktopActivity;
use App\Models\User;
use App\Services\TimesheetEntryWindowTitlesResolver;
use Carbon\CarbonImmutable;

beforeEach(function () {
    config(['services.timesheets.timezone' => 'UTC']);
});

it('returns window titles that overlap a timesheet slot', function () {
    $user = User::factory()->create();
    $day = CarbonImmutable::parse('2026-05-18', 'UTC');

    DesktopActivity::factory()->for($user)->create([
        'app_name' => 'Google Chrome',
        'window_title' => 'OfficeMate — Dashboard',
        'browser_tab_title' => null,
        'browser_domain' => null,
        'started_at' => $day->setTime(15, 45),
        'ended_at' => $day->setTime(15, 50),
        'duration_seconds' => 300,
    ]);

    DesktopActivity::factory()->for($user)->create([
        'app_name' => 'Google Chrome',
        'window_title' => 'GitHub — Pull requests',
        'browser_tab_title' => null,
        'browser_domain' => null,
        'started_at' => $day->setTime(15, 52),
        'ended_at' => $day->setTime(16, 0),
        'duration_seconds' => 480,
    ]);

    $titles = app(TimesheetEntryWindowTitlesResolver::class)->forSlot(
        $user,
        '2026-05-18',
        15 * 60 + 45,
        16 * 60,
    );

    expect($titles)->toContain('OfficeMate — Dashboard')
        ->and($titles)->toContain('GitHub — Pull requests');
});

it('returns only windows from the best matching coalesced block', function () {
    $user = User::factory()->create();
    $day = CarbonImmutable::parse('2026-05-18', 'UTC');

    DesktopActivity::factory()->for($user)->create([
        'app_name' => 'Code',
        'window_title' => 'Morning project',
        'browser_tab_title' => null,
        'browser_domain' => null,
        'started_at' => $day->setTime(9, 0),
        'ended_at' => $day->setTime(9, 30),
        'duration_seconds' => 1800,
    ]);

    DesktopActivity::factory()->for($user)->create([
        'app_name' => 'Code',
        'window_title' => 'Afternoon project',
        'browser_tab_title' => null,
        'browser_domain' => null,
        'started_at' => $day->setTime(14, 0),
        'ended_at' => $day->setTime(14, 30),
        'duration_seconds' => 1800,
    ]);

    $titles = app(TimesheetEntryWindowTitlesResolver::class)->forSlot(
        $user,
        '2026-05-18',
        14 * 60,
        14 * 60 + 20,
    );

    expect($titles)->toBe(['Afternoon project'])
        ->and($titles)->not->toContain('Morning project');
});

it('excludes synthetic timesheet browser tab titles from tracker data', function () {
    $user = User::factory()->create();
    $day = CarbonImmutable::parse('2026-05-18', 'UTC');

    DesktopActivity::factory()->for($user)->create([
        'app_name' => 'Google Chrome',
        'window_title' => 'GitHub — Pull requests',
        'browser_tab_title' => null,
        'browser_domain' => null,
        'started_at' => $day->setTime(15, 45),
        'ended_at' => $day->setTime(15, 55),
        'duration_seconds' => 600,
    ]);

    DesktopActivity::factory()->for($user)->create([
        'app_name' => 'Google Chrome',
        'window_title' => 'Tijdregistratie en statuscontrole · ma 18 mei · 15:45 – 16:00 · Timesheets',
        'browser_tab_title' => null,
        'browser_domain' => null,
        'started_at' => $day->setTime(15, 50),
        'ended_at' => $day->setTime(16, 0),
        'duration_seconds' => 600,
    ]);

    $titles = app(TimesheetEntryWindowTitlesResolver::class)->forSlot(
        $user,
        '2026-05-18',
        15 * 60 + 45,
        16 * 60,
    );

    expect($titles)->toContain('GitHub — Pull requests')
        ->and($titles)->not->toContain(
            'Tijdregistratie en statuscontrole · ma 18 mei · 15:45 – 16:00 · Timesheets',
        );
});
