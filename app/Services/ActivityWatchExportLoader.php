<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Reads ActivityWatch JSON exports from local storage and turns them into
 * coarse-grained work blocks (groups of consecutive events).
 */
final class ActivityWatchExportLoader
{
    private const string DEFAULT_RELATIVE_PATH = 'app/activitywatch';

    public function __construct(
        private readonly WorkBlockCoalescer $coalescer,
    ) {}

    /**
     * @return list<array{
     *     worked_on: string,
     *     start: string,
     *     end: string,
     *     start_minutes: int,
     *     end_minutes: int,
     *     duration_minutes: int,
     *     applications: list<array{application: string, window_title: string, minutes: int}>
     * }>
     */
    public function loadWorkBlocksForRange(
        CarbonImmutable $rangeStart,
        CarbonImmutable $rangeEnd,
        ?string $timezone = null,
    ): array {
        $payload = $this->latestExportPayload();

        if ($payload === null) {
            return [];
        }

        $tz = $timezone ?? config('app.timezone', 'UTC');
        $from = $rangeStart->setTimezone($tz)->startOfDay();
        $toExclusive = $rangeEnd->setTimezone($tz)->endOfDay()->addSecond();

        $events = $this->normaliseEvents($payload, $tz)
            ->filter(fn (array $event): bool => $event['start']->greaterThanOrEqualTo($from)
                && $event['start']->lessThan($toExclusive))
            ->sortBy(fn (array $event): int => $event['start']->getTimestamp())
            ->values();

        return $this->coalescer->coalesce($events);
    }

    /**
     * @return list<array{
     *     worked_on: string,
     *     start: string,
     *     end: string,
     *     start_minutes: int,
     *     end_minutes: int,
     *     duration_minutes: int,
     *     applications: list<array{application: string, window_title: string, minutes: int}>
     * }>
     */
    public function loadWorkBlocksForDay(CarbonImmutable $day, ?string $timezone = null): array
    {
        return $this->loadWorkBlocksForRange($day, $day, $timezone);
    }

    /**
     * @return list<array{
     *     worked_on: string,
     *     start: string,
     *     end: string,
     *     start_minutes: int,
     *     end_minutes: int,
     *     duration_minutes: int,
     *     applications: list<array{application: string, window_title: string, minutes: int}>
     * }>
     */
    public function loadWorkBlocksForWeek(CarbonImmutable $weekMonday, ?string $timezone = null): array
    {
        return $this->loadWorkBlocksForRange($weekMonday, $weekMonday->addDays(6), $timezone);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function latestExportPayload(): ?array
    {
        $directory = $this->exportDirectory();

        if (! is_dir($directory)) {
            return null;
        }

        $files = glob($directory.DIRECTORY_SEPARATOR.'*.json') ?: [];

        if ($files === []) {
            return null;
        }

        usort($files, fn (string $a, string $b): int => filemtime($b) <=> filemtime($a));

        $contents = @file_get_contents($files[0]);

        if (! is_string($contents) || $contents === '') {
            return null;
        }

        try {
            $payload = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }

        return is_array($payload) ? $payload : null;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return Collection<int, array{
     *     start: CarbonImmutable,
     *     end: CarbonImmutable,
     *     application: string,
     *     window_title: string,
     *     duration: float
     * }>
     */
    private function normaliseEvents(array $payload, string $timezone): Collection
    {
        $raw = $payload['active_applications'] ?? [];

        if (! is_array($raw)) {
            return collect();
        }

        return collect($raw)
            ->map(function (mixed $event) use ($timezone): ?array {
                if (! is_array($event)) {
                    return null;
                }

                $application = $this->coalescer->stripInvisibleChars((string) ($event['application'] ?? ''));
                $windowTitle = $this->coalescer->stripInvisibleChars((string) ($event['window_title'] ?? ''));
                $timestamp = $event['timestamp'] ?? null;
                $duration = (float) ($event['duration_seconds'] ?? 0);

                if ($application === '' || ! is_string($timestamp) || $duration <= 0) {
                    return null;
                }

                if ($this->coalescer->isIgnoredApp($application)) {
                    return null;
                }

                try {
                    $start = CarbonImmutable::parse($timestamp)->setTimezone($timezone);
                } catch (\Throwable) {
                    return null;
                }

                $end = $start->addSeconds((int) max(1, round($duration)));

                return [
                    'start' => $start,
                    'end' => $end,
                    'application' => $application,
                    'window_title' => $windowTitle === '' ? $application : $windowTitle,
                    'duration' => $duration,
                ];
            })
            ->filter()
            ->values();
    }

    public function exportDirectory(): string
    {
        $configured = config('services.activitywatch.export_path');

        if (is_string($configured) && $configured !== '') {
            return rtrim($configured, DIRECTORY_SEPARATOR);
        }

        return storage_path(self::DEFAULT_RELATIVE_PATH);
    }
}
