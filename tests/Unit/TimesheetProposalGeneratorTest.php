<?php

use App\Models\DesktopActivity;
use App\Models\TimesheetEntry;
use App\Models\TimesheetEntryProposal;
use App\Models\User;
use App\Services\TimesheetProposalGenerator;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

function writeAwExport(string $directory, array $payload): void
{
    if (! is_dir($directory)) {
        mkdir($directory, 0777, true);
    }

    file_put_contents($directory.'/export.json', json_encode($payload));
}

beforeEach(function () {
    Config::set('app.timezone', 'UTC');
    Config::set('services.timesheets.timezone', 'UTC');
    // Geïsoleerde, niet-bestaande directory zodat tests niet per ongeluk de
    // lokale AW-export uit storage/app/activitywatch/ inlezen.
    Config::set(
        'services.activitywatch.export_path',
        sys_get_temp_dir().'/officemate-aw-isolated-'.uniqid('', true),
    );
    Http::preventStrayRequests();
});

it('creates fallback proposals with status unconfigured when OPENAI_API_KEY is missing', function () {
    Config::set('services.openai.key', null);

    $user = User::factory()->create();

    DesktopActivity::factory()->for($user)->create([
        'app_name' => 'Cursor',
        'window_title' => 'OfficeMate',
        'started_at' => '2026-05-11 09:00:00',
        'ended_at' => '2026-05-11 10:00:00',
        'duration_seconds' => 3600,
    ]);

    $result = app(TimesheetProposalGenerator::class)
        ->generateForWeek($user, CarbonImmutable::parse('2026-05-11'));

    expect($result['status'])->toBe('unconfigured')
        ->and($result['proposals'])->toHaveCount(1);
});

it('reports no_activity when there are no work blocks', function () {
    Config::set('services.openai.key', 'sk-test');

    $result = app(TimesheetProposalGenerator::class)
        ->generateForWeek(User::factory()->create(), CarbonImmutable::parse('2026-05-11'));

    expect($result['status'])->toBe('no_activity');
});

it('persists OpenAI proposals, drops weekend/overlapping rows, and replaces previous proposals for the week', function () {
    Config::set('services.openai.key', 'sk-test');
    Config::set('services.openai.model', 'gpt-4o-mini');

    $user = User::factory()->create();

    DesktopActivity::factory()->for($user)->create([
        'app_name' => 'Cursor',
        'window_title' => 'OfficeMate',
        'started_at' => '2026-05-11 09:00:00',
        'ended_at' => '2026-05-11 10:00:00',
        'duration_seconds' => 3600,
    ]);

    Http::fake([
        'api.openai.com/v1/chat/completions' => Http::response([
            'choices' => [[
                'message' => [
                    'content' => json_encode([
                        'proposals' => [
                            [
                                'worked_on' => '2026-05-11',
                                'start' => '09:00',
                                'end' => '10:30',
                                'title' => 'OfficeMate ontwikkeling',
                                'description' => 'Werk aan AI-voorstellen module.',
                                'client_name' => null,
                            ],
                            [
                                'worked_on' => '2026-05-11',
                                'start' => '11:00',
                                'end' => '12:00',
                                'title' => 'Overlapt met bestaande entry',
                                'description' => null,
                                'client_name' => null,
                            ],
                        ],
                    ]),
                ],
            ]],
        ]),
    ]);

    TimesheetEntry::factory()->for($user)->create([
        'worked_on' => '2026-05-11',
        'start_minutes' => 11 * 60,
        'end_minutes' => 12 * 60,
    ]);

    TimesheetEntryProposal::factory()->for($user)->create([
        'worked_on' => '2026-05-11',
        'title' => 'Oud voorstel',
        'start_minutes' => 14 * 60,
        'end_minutes' => 15 * 60,
    ]);

    $result = app(TimesheetProposalGenerator::class)
        ->generateForWeek($user, CarbonImmutable::parse('2026-05-11'));

    expect($result['status'])->toBe('ready')
        ->and($result['proposals'])->toHaveCount(1)
        ->and($result['proposals'][0]->title)->toBe('OfficeMate ontwikkeling')
        ->and($result['proposals'][0]->source)->toBe('desktop_tracker')
        ->and(TimesheetEntryProposal::query()->where('title', 'Oud voorstel')->exists())->toBeFalse();

    Http::assertSent(function (Request $request) {
        return $request->url() === 'https://api.openai.com/v1/chat/completions'
            && $request['model'] === 'gpt-4o-mini'
            && $request['response_format']['type'] === 'json_object';
    });
});

it('creates fallback proposals with status error when OpenAI fails', function () {
    Config::set('services.openai.key', 'sk-test');

    $user = User::factory()->create();

    DesktopActivity::factory()->for($user)->create([
        'app_name' => 'Cursor',
        'window_title' => 'Werk',
        'started_at' => '2026-05-11 09:00:00',
        'ended_at' => '2026-05-11 09:30:00',
        'duration_seconds' => 1800,
    ]);

    Http::fake([
        'api.openai.com/v1/chat/completions' => Http::response(['error' => 'oops'], 500),
    ]);

    $result = app(TimesheetProposalGenerator::class)
        ->generateForWeek($user, CarbonImmutable::parse('2026-05-11'));

    expect($result['status'])->toBe('error')
        ->and($result['proposals'])->toHaveCount(1);
});

it('falls back to ActivityWatch export when no desktop activity rows exist', function () {
    Config::set('services.openai.key', null);

    $tempDir = sys_get_temp_dir().'/officemate-aw-'.uniqid('', true);
    Config::set('services.activitywatch.export_path', $tempDir);

    writeAwExport($tempDir, [
        'active_applications' => [
            [
                'timestamp' => '2026-05-11T09:00:00+00:00',
                'duration_seconds' => 1800,
                'application' => 'Cursor',
                'window_title' => 'AW fallback',
            ],
        ],
    ]);

    $user = User::factory()->create();

    $result = app(TimesheetProposalGenerator::class)
        ->generateForWeek($user, CarbonImmutable::parse('2026-05-11'));

    expect($result['status'])->toBe('unconfigured')
        ->and($result['proposals'])->toHaveCount(1)
        ->and($result['proposals'][0]->worked_on->toDateString())->toBe('2026-05-11');

    foreach (glob($tempDir.'/*') ?: [] as $file) {
        @unlink($file);
    }

    @rmdir($tempDir);
});

it('skips weekend days from tracker data (consistent with TimesheetEntry rules)', function () {
    Config::set('services.openai.key', null);

    $user = User::factory()->create();

    DesktopActivity::factory()->for($user)->create([
        'app_name' => 'Cursor',
        'window_title' => 'Weekend werk',
        'started_at' => '2026-05-16 10:00:00',
        'ended_at' => '2026-05-16 11:00:00',
        'duration_seconds' => 3600,
    ]);

    $result = app(TimesheetProposalGenerator::class)
        ->generateForDay($user, CarbonImmutable::parse('2026-05-16'));

    expect($result['status'])->toBe('no_activity')
        ->and($result['proposals'])->toHaveCount(0);
});
