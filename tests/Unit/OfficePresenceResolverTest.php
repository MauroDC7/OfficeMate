<?php

use App\Models\User;
use App\Services\OfficePresenceResolver;
use App\Support\OfficeIpAddress;
use Carbon\CarbonImmutable;

beforeEach(function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-19 10:00:00', 'UTC'));
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

it('returns true when the user was seen at the office today', function () {
    $user = User::factory()->create([
        'last_seen_at_office' => CarbonImmutable::now(),
    ]);

    expect(app(OfficePresenceResolver::class)->isInOffice($user))->toBeTrue();
});

it('returns false when the user was last seen at the office on a previous day', function () {
    $user = User::factory()->create([
        'last_seen_at_office' => CarbonImmutable::now()->subDay(),
    ]);

    expect(app(OfficePresenceResolver::class)->isInOffice($user))->toBeFalse();
});

it('matches exact ip addresses and cidr blocks', function () {
    expect(OfficeIpAddress::matches('203.0.113.10', ['203.0.113.10']))->toBeTrue()
        ->and(OfficeIpAddress::matches('203.0.113.55', ['203.0.113.0/24']))->toBeTrue()
        ->and(OfficeIpAddress::matches('198.51.100.4', ['203.0.113.10']))->toBeFalse();
});
