<?php

use App\Services\Timy\TimyDutchDateRangeParser;
use Carbon\CarbonImmutable;

beforeEach(function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 10:00:00', 'Europe/Brussels'));
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

it('parses dutch month names without a year', function () {
    $range = app(TimyDutchDateRangeParser::class)->extractRange(
        'Vraag verlof aan voor 7 Juni tot 13 Juni',
    );

    expect($range)->toBe(['2026-06-07', '2026-06-13']);
});

it('parses belgian dd-mm-yyyy dates', function () {
    $range = app(TimyDutchDateRangeParser::class)->extractRange(
        'vakantie van 01-07-2026 tot 05-07-2026',
    );

    expect($range)->toBe(['2026-07-01', '2026-07-05']);
});

it('parses van X tot Y in the same month', function () {
    $range = app(TimyDutchDateRangeParser::class)->extractRange(
        'verlof van 7 tot 13 juni',
    );

    expect($range)->toBe(['2026-06-07', '2026-06-13']);
});

it('parses iso dates', function () {
    $range = app(TimyDutchDateRangeParser::class)->extractRange(
        'vakantie 2026-08-01 tot 2026-08-10',
    );

    expect($range)->toBe(['2026-08-01', '2026-08-10']);
});

it('returns null when the end date is before the start date', function () {
    $range = app(TimyDutchDateRangeParser::class)->extractRange(
        'verlof 13 juni tot 7 juni',
    );

    expect($range)->toBeNull();
});
