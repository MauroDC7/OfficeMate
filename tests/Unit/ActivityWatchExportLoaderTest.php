<?php

use App\Services\ActivityWatchExportLoader;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Config;

beforeEach(function () {
    Config::set('app.timezone', 'UTC');

    $tempDir = sys_get_temp_dir().'/officemate-aw-'.uniqid('', true);
    mkdir($tempDir, 0777, true);
    Config::set('services.activitywatch.export_path', $tempDir);

    $this->awDir = $tempDir;
});

afterEach(function () {
    if (isset($this->awDir) && is_dir($this->awDir)) {
        foreach (glob($this->awDir.'/*') ?: [] as $file) {
            @unlink($file);
        }
        @rmdir($this->awDir);
    }
});

function writeExport(string $directory, array $payload): void
{
    file_put_contents($directory.'/export.json', json_encode($payload));
}

it('returns no work blocks when the export directory is empty', function () {
    $loader = app(ActivityWatchExportLoader::class);

    expect(
        $loader->loadWorkBlocksForWeek(CarbonImmutable::parse('2026-05-11')),
    )->toBe([]);
});

it('groups consecutive same-window events, drops ignored apps, and aggregates per block', function () {
    writeExport($this->awDir, [
        'period' => ['start' => '2026-05-11', 'end' => '2026-05-15'],
        'active_applications' => [
            [
                'timestamp' => '2026-05-11T09:00:00+00:00',
                'duration_seconds' => 600,
                'application' => 'Cursor',
                'window_title' => 'OfficeMate — App',
            ],
            [
                'timestamp' => '2026-05-11T09:11:00+00:00',
                'duration_seconds' => 900,
                'application' => 'Cursor',
                'window_title' => 'OfficeMate — App',
            ],
            [
                'timestamp' => '2026-05-11T09:30:00+00:00',
                'duration_seconds' => 60,
                'application' => 'Discord',
                'window_title' => 'noise',
            ],
            [
                'timestamp' => '2026-05-11T14:00:00+00:00',
                'duration_seconds' => 1800,
                'application' => 'Arc',
                'window_title' => 'GitHub — issue #1',
            ],
            [
                'timestamp' => '2026-05-11T14:00:00+00:00',
                'duration_seconds' => 5,
                'application' => 'Arc',
                'window_title' => 'OfficeMate continued',
            ],
        ],
    ]);

    $blocks = app(ActivityWatchExportLoader::class)
        ->loadWorkBlocksForWeek(CarbonImmutable::parse('2026-05-11'));

    expect($blocks)->toHaveCount(2);

    [$morning, $afternoon] = $blocks;

    expect($morning['worked_on'])->toBe('2026-05-11')
        ->and($morning['start'])->toBe('09:00')
        ->and($morning['duration_minutes'])->toBeGreaterThanOrEqual(25)
        ->and($morning['applications'][0]['application'])->toBe('Cursor');

    expect($afternoon['worked_on'])->toBe('2026-05-11')
        ->and($afternoon['start'])->toBe('14:00')
        ->and($afternoon['applications'][0]['application'])->toBe('Arc');
});

it('ignores events outside the requested week', function () {
    writeExport($this->awDir, [
        'active_applications' => [
            [
                'timestamp' => '2026-05-04T09:00:00+00:00',
                'duration_seconds' => 1200,
                'application' => 'Cursor',
                'window_title' => 'Previous week',
            ],
            [
                'timestamp' => '2026-05-12T09:00:00+00:00',
                'duration_seconds' => 1200,
                'application' => 'Cursor',
                'window_title' => 'Target week',
            ],
        ],
    ]);

    $blocks = app(ActivityWatchExportLoader::class)
        ->loadWorkBlocksForWeek(CarbonImmutable::parse('2026-05-11'));

    expect($blocks)->toHaveCount(1)
        ->and($blocks[0]['worked_on'])->toBe('2026-05-12');
});

it('loadWorkBlocksForDay returns blocks only for the given day', function () {
    writeExport($this->awDir, [
        'active_applications' => [
            [
                'timestamp' => '2026-05-11T09:00:00+00:00',
                'duration_seconds' => 600,
                'application' => 'Cursor',
                'window_title' => 'Maandag',
            ],
            [
                'timestamp' => '2026-05-12T09:00:00+00:00',
                'duration_seconds' => 600,
                'application' => 'Cursor',
                'window_title' => 'Dinsdag',
            ],
        ],
    ]);

    $blocks = app(ActivityWatchExportLoader::class)
        ->loadWorkBlocksForDay(CarbonImmutable::parse('2026-05-12'));

    expect($blocks)->toHaveCount(1)
        ->and($blocks[0]['worked_on'])->toBe('2026-05-12');
});
