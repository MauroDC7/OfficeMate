<?php

declare(strict_types=1);

use App\Services\TrackerBlocklistMatcher;

it('matches blocklist entries case-insensitively', function () {
    $matcher = new TrackerBlocklistMatcher;

    expect($matcher->matches(['spotify'], 'Spotify.exe', 'Spotify Premium'))->toBeTrue()
        ->and($matcher->matches(['netflix'], 'Visual Studio Code'))->toBeFalse();
});

it('normalizes and deduplicates blocklist entries', function () {
    $matcher = new TrackerBlocklistMatcher;

    expect($matcher->normalizeBlocklist([' Spotify ', 'spotify', '', 'WhatsApp']))->toBe(['spotify', 'whatsapp']);
});
