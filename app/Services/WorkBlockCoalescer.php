<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/**
 * Merges raw foreground events into coarse work blocks for LLM summarisation.
 */
final class WorkBlockCoalescer
{
    /**
     * @var list<string>
     */
    private const array IGNORED_APPS = [
        'Discord',
        'WhatsApp',
        'Messages',
        'Spotify',
        'Music',
        'Telegram',
        'Signal',
        'loginwindow',
    ];

    private const int MERGE_GAP_SECONDS = 10 * 60;

    private const int MIN_BLOCK_MINUTES = 2;

    public function isIgnoredApp(string $application): bool
    {
        return in_array($application, self::IGNORED_APPS, true);
    }

    public function stripInvisibleChars(string $value): string
    {
        return trim(preg_replace('/[\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2060}\x{FEFF}]/u', '', $value) ?? $value);
    }

    /**
     * @param  Collection<int, array{
     *     start: CarbonImmutable,
     *     end: CarbonImmutable,
     *     application: string,
     *     window_title: string,
     *     duration: float
     * }>  $events
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
    public function coalesce(Collection $events): array
    {
        if ($events->isEmpty()) {
            return [];
        }

        return $this->blocksToArray($this->coalesceIntoBlocks($events));
    }

    /**
     * @param  Collection<int, array{
     *     start: CarbonImmutable,
     *     end: CarbonImmutable,
     *     application: string,
     *     window_title: string,
     *     duration: float
     * }>  $events
     * @return list<array{start: CarbonImmutable, end: CarbonImmutable, apps: array<string, int>}>
     */
    private function coalesceIntoBlocks(Collection $events): array
    {
        $blocks = [];
        $current = null;

        foreach ($events as $event) {
            if ($current === null) {
                $current = $this->newBlockFromEvent($event);

                continue;
            }

            $gapSeconds = max(0, $event['start']->getTimestamp() - $current['end']->getTimestamp());
            $sameDay = $event['start']->isSameDay($current['start']);

            if ($sameDay && $gapSeconds <= self::MERGE_GAP_SECONDS) {
                if ($event['end']->greaterThan($current['end'])) {
                    $current['end'] = $event['end'];
                }

                $key = $this->blockKey($event['application'], $event['window_title']);
                $current['apps'][$key] = ($current['apps'][$key] ?? 0)
                    + (int) max(1, round($event['duration']));

                continue;
            }

            $blocks[] = $current;
            $current = $this->newBlockFromEvent($event);
        }

        if ($current !== null) {
            $blocks[] = $current;
        }

        $minSeconds = self::MIN_BLOCK_MINUTES * 60;

        return array_values(array_filter(
            $blocks,
            fn (array $block): bool => ($block['end']->getTimestamp() - $block['start']->getTimestamp()) >= $minSeconds,
        ));
    }

    /**
     * @param  array{
     *     start: CarbonImmutable,
     *     end: CarbonImmutable,
     *     application: string,
     *     window_title: string,
     *     duration: float
     * }  $event
     * @return array{start: CarbonImmutable, end: CarbonImmutable, apps: array<string, int>}
     */
    private function newBlockFromEvent(array $event): array
    {
        return [
            'start' => $event['start'],
            'end' => $event['end'],
            'apps' => [
                $this->blockKey($event['application'], $event['window_title']) => (int) max(1, round($event['duration'])),
            ],
        ];
    }

    private function blockKey(string $application, string $windowTitle): string
    {
        return $application.'||'.$windowTitle;
    }

    /**
     * @param  list<array{start: CarbonImmutable, end: CarbonImmutable, apps: array<string, int>}>  $blocks
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
    private function blocksToArray(array $blocks): array
    {
        return array_values(array_map(function (array $block): array {
            arsort($block['apps']);

            $applications = [];

            foreach (array_slice($block['apps'], 0, 8, true) as $key => $seconds) {
                [$application, $windowTitle] = array_pad(explode('||', $key, 2), 2, $key);
                $applications[] = [
                    'application' => $application,
                    'window_title' => $windowTitle,
                    'minutes' => max(1, (int) round($seconds / 60)),
                ];
            }

            $durationSeconds = $block['end']->getTimestamp() - $block['start']->getTimestamp();

            return [
                'worked_on' => $block['start']->format('Y-m-d'),
                'start' => $block['start']->format('H:i'),
                'end' => $block['end']->format('H:i'),
                'start_minutes' => $this->minutesFromCarbon($block['start']),
                'end_minutes' => $this->minutesFromCarbon($block['end']),
                'duration_minutes' => max(1, (int) round($durationSeconds / 60)),
                'applications' => $applications,
            ];
        }, $blocks));
    }

    private function minutesFromCarbon(CarbonInterface $when): int
    {
        return $when->hour * 60 + $when->minute;
    }
}
