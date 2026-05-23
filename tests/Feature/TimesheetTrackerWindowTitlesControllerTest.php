<?php

use App\Models\DesktopActivity;
use App\Models\User;
use Carbon\CarbonImmutable;

beforeEach(function () {
    config(['services.timesheets.timezone' => 'UTC']);
});

it('returns tracker window titles for a requested slot', function () {
    $user = User::factory()->create();
    $day = CarbonImmutable::parse('2026-05-18', 'UTC');

    DesktopActivity::factory()->for($user)->create([
        'app_name' => 'Cursor',
        'window_title' => 'timesheet-form-popup.tsx',
        'browser_tab_title' => null,
        'browser_domain' => null,
        'started_at' => $day->setTime(10, 0),
        'ended_at' => $day->setTime(10, 15),
        'duration_seconds' => 900,
    ]);

    $response = $this->actingAs($user)
        ->getJson(route('timesheets.tracker-window-titles', [
            'worked_on' => '2026-05-18',
            'start_minutes' => 10 * 60,
            'end_minutes' => 10 * 60 + 20,
        ]))
        ->assertOk();

    expect($response->json('titles'))->toContain('timesheet-form-popup.tsx');
});
