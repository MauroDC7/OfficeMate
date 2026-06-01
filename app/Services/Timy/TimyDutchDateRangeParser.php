<?php

namespace App\Services\Timy;

use Carbon\CarbonImmutable;
use Illuminate\Support\Str;

/**
 * Parses common Belgian / Dutch date ranges from Timy chat messages.
 */
final class TimyDutchDateRangeParser
{
    /** @var array<string, int> */
    private const MONTHS = [
        'januari' => 1,
        'jan' => 1,
        'februari' => 2,
        'feb' => 2,
        'maart' => 3,
        'mrt' => 3,
        'april' => 4,
        'apr' => 4,
        'mei' => 5,
        'juni' => 6,
        'jun' => 6,
        'juli' => 7,
        'jul' => 7,
        'augustus' => 8,
        'aug' => 8,
        'september' => 9,
        'sep' => 9,
        'sept' => 9,
        'oktober' => 10,
        'okt' => 10,
        'november' => 11,
        'nov' => 11,
        'december' => 12,
        'dec' => 12,
    ];

    public function containsDateHint(string $message): bool
    {
        return $this->extractRange($message) !== null;
    }

    /**
     * @return array{0: string, 1: string}|null ISO date strings (Y-m-d)
     */
    public function extractRange(string $message): ?array
    {
        $range = $this->fromIso($message)
            ?? $this->fromBelgianNumeric($message)
            ?? $this->fromVanTotSameMonth($message)
            ?? $this->fromDutchNamed($message);

        if ($range === null) {
            return null;
        }

        [$startsOn, $endsOn] = $range;

        if ($startsOn > $endsOn) {
            return null;
        }

        return $range;
    }

    /**
     * @return array{0: string, 1: string}|null
     */
    private function fromIso(string $message): ?array
    {
        preg_match_all('/\d{4}-\d{2}-\d{2}/', $message, $matches);

        if (! isset($matches[0]) || count($matches[0]) < 2) {
            return null;
        }

        return [$matches[0][0], $matches[0][1]];
    }

    /**
     * @return array{0: string, 1: string}|null
     */
    private function fromBelgianNumeric(string $message): ?array
    {
        preg_match_all('/\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/', $message, $matches);

        if (! isset($matches[0]) || count($matches[0]) < 2) {
            return null;
        }

        $parsed = [];

        foreach (array_slice($matches[0], 0, 2) as $raw) {
            $separator = str_contains($raw, '/') ? '/' : '-';
            $date = $this->parseBelgianNumeric($raw, $separator);

            if ($date === null) {
                return null;
            }

            $parsed[] = $date;
        }

        return [$parsed[0], $parsed[1]];
    }

    /**
     * @return array{0: string, 1: string}|null
     */
    private function fromVanTotSameMonth(string $message): ?array
    {
        $pattern = '/van\s+(\d{1,2})\s+(?:tot|t\/m|tm)\s+(\d{1,2})\s+('.$this->monthPattern().')\b(?:\s+(\d{4}))?/iu';

        if (preg_match($pattern, $message, $match) !== 1) {
            return null;
        }

        $month = $this->monthNumber($match[3]);

        if ($month === null) {
            return null;
        }

        $year = isset($match[4]) && $match[4] !== '' ? (int) $match[4] : null;
        $start = $this->buildDate((int) $match[1], $month, $year);
        $end = $this->buildDate((int) $match[2], $month, $year);

        if ($start === null || $end === null) {
            return null;
        }

        return [$start, $end];
    }

    /**
     * @return array{0: string, 1: string}|null
     */
    private function fromDutchNamed(string $message): ?array
    {
        $pattern = '/(\d{1,2})\s+('.$this->monthPattern().')\b(?:\s+(\d{4}))?/iu';

        if (preg_match_all($pattern, $message, $matches, PREG_SET_ORDER) < 2) {
            return null;
        }

        $first = $this->dateFromMatch($matches[0]);
        $second = $this->dateFromMatch($matches[1]);

        if ($first === null || $second === null) {
            return null;
        }

        return [$first, $second];
    }

    /**
     * @param  array<int, string>  $match
     */
    private function dateFromMatch(array $match): ?string
    {
        $month = $this->monthNumber($match[2]);

        if ($month === null) {
            return null;
        }

        $year = isset($match[3]) && $match[3] !== '' ? (int) $match[3] : null;

        return $this->buildDate((int) $match[1], $month, $year);
    }

    private function parseBelgianNumeric(string $raw, string $separator): ?string
    {
        $format = $separator === '/' ? 'd/m/Y' : 'd-m-Y';

        try {
            return CarbonImmutable::createFromFormat($format, $raw, 'Europe/Brussels')->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function buildDate(int $day, int $month, ?int $year): ?string
    {
        $year ??= (int) CarbonImmutable::now('Europe/Brussels')->year;

        try {
            $date = CarbonImmutable::create($year, $month, $day, 0, 0, 0, 'Europe/Brussels');
        } catch (\Throwable) {
            return null;
        }

        $today = CarbonImmutable::now('Europe/Brussels')->startOfDay();

        if ($year === $today->year && $date->lt($today->subWeek())) {
            $date = $date->addYear();
        }

        return $date->toDateString();
    }

    private function monthNumber(string $name): ?int
    {
        return self::MONTHS[Str::lower($name)] ?? null;
    }

    private function monthPattern(): string
    {
        return implode('|', array_map(
            static fn (string $month): string => preg_quote($month, '/'),
            array_keys(self::MONTHS),
        ));
    }
}
