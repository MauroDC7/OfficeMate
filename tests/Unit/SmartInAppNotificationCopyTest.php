<?php

use App\Enums\InAppNotificationKind;
use App\Models\User;
use App\Services\SmartInAppNotificationCopy;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Config::set('services.openai.key', null);
});

it('returns fallback when openai is not configured', function () {
    $user = User::factory()->make(['first_name' => 'Mauro']);
    $fallback = ['title' => 'Verlof goedgekeurd', 'message' => 'Vakantie (01/06/2026)'];

    $payload = app(SmartInAppNotificationCopy::class)->generate(
        InAppNotificationKind::LeaveApproved,
        $user,
        ['leave_type' => 'Vakantie', 'period' => '01/06/2026 tot 05/06/2026'],
        $fallback,
    );

    expect($payload)->toBe($fallback);
});

it('returns ai copy when openai responds with valid json', function () {
    Config::set('services.openai.key', 'sk-test');
    Config::set('services.openai.model', 'gpt-4o-mini');

    Http::fake([
        'api.openai.com/v1/chat/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'title' => 'Yes, goedgekeurd',
                            'message' => 'Mauro, je vakantie staat. Geniet ervan!',
                        ], JSON_THROW_ON_ERROR),
                    ],
                ],
            ],
        ], 200),
    ]);

    $user = User::factory()->make(['first_name' => 'Mauro']);
    $fallback = ['title' => 'Verlof goedgekeurd', 'message' => 'Vakantie (01/06/2026)'];

    $payload = app(SmartInAppNotificationCopy::class)->generate(
        InAppNotificationKind::LeaveApproved,
        $user,
        ['leave_type' => 'Vakantie', 'period' => '01/06/2026 tot 05/06/2026'],
        $fallback,
    );

    expect($payload['title'])->toBe('Yes, goedgekeurd')
        ->and($payload['message'])->toBe('Mauro, je vakantie staat. Geniet ervan!');
});

it('strips em dashes from ai output', function () {
    Config::set('services.openai.key', 'sk-test');
    Config::set('services.openai.model', 'gpt-4o-mini');

    Http::fake([
        'api.openai.com/v1/chat/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'title' => 'Update',
                            'message' => 'Vakantie — goedgekeurd voor volgende week',
                        ], JSON_THROW_ON_ERROR),
                    ],
                ],
            ],
        ], 200),
    ]);

    $user = User::factory()->make(['first_name' => 'Lisa']);

    $payload = app(SmartInAppNotificationCopy::class)->generate(
        InAppNotificationKind::LeaveApproved,
        $user,
        ['leave_type' => 'Vakantie', 'period' => '10/06/2026'],
        ['title' => 'fallback', 'message' => 'fallback'],
    );

    expect($payload['message'])->not->toContain('—')
        ->and($payload['message'])->toBe('Vakantie goedgekeurd voor volgende week');
});

it('returns fallback when openai fails', function () {
    Config::set('services.openai.key', 'sk-test');
    Config::set('services.openai.model', 'gpt-4o-mini');

    Http::fake([
        'api.openai.com/v1/chat/completions' => Http::response(['error' => 'down'], 500),
    ]);

    $user = User::factory()->make(['first_name' => 'Mauro']);
    $fallback = ['title' => 'Verlof afgewezen', 'message' => 'Helaas niet goedgekeurd.'];

    $payload = app(SmartInAppNotificationCopy::class)->generate(
        InAppNotificationKind::LeaveRejected,
        $user,
        ['leave_type' => 'Vakantie', 'period' => '01/06/2026', 'rejection_reason' => 'Te druk'],
        $fallback,
    );

    expect($payload)->toBe($fallback);
});
