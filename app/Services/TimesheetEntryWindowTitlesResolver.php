<?php

namespace App\Services;

use App\Models\TimesheetEntry;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Resolves desktop-tracker window titles for a timesheet time slot.
 */
final class TimesheetEntryWindowTitlesResolver
{
    public function __construct(
        private readonly DesktopActivityWorkBlockLoader $loader,
        private readonly TimesheetSyntheticWindowTitleFilter $syntheticTitleFilter,
    ) {}

    /**
     * @param  iterable<TimesheetEntry>  $entries
     * @return array<int, list<string>>
     */
    public function forEntries(User $user, iterable $entries): array
    {
        $collection = $entries instanceof Collection
            ? $entries
            : collect($entries);

        $byDay = $collection->groupBy(
            fn (TimesheetEntry $entry) => $entry->worked_on->format('Y-m-d'),
        );

        $result = [];

        foreach ($byDay as $workedOnYmd => $dayEntries) {
            $blocks = $this->loader->loadWorkBlocksForDay(
                $user,
                CarbonImmutable::parse((string) $workedOnYmd),
            );

            foreach ($dayEntries as $entry) {
                $result[$entry->id] = $this->titlesForSlot(
                    $blocks,
                    $entry->start_minutes,
                    $entry->end_minutes,
                    $entry->title,
                );
            }
        }

        return $result;
    }

    /**
     * @return list<string>
     */
    public function forSlot(
        User $user,
        string $workedOnYmd,
        int $startMinutes,
        int $endMinutes,
    ): array {
        $blocks = $this->loader->loadWorkBlocksForDay(
            $user,
            CarbonImmutable::parse($workedOnYmd),
        );

        return $this->titlesForSlot($blocks, $startMinutes, $endMinutes);
    }

    /**
     * @param  list<array<string, mixed>>  $blocks
     * @return list<string>
     */
    private function titlesForSlot(
        array $blocks,
        int $startMinutes,
        int $endMinutes,
        ?string $excludeTitle = null,
    ): array {
        $block = $this->bestOverlappingBlock($blocks, $startMinutes, $endMinutes);

        if ($block === null) {
            return [];
        }

        $titles = [];

        foreach ($block['applications'] ?? [] as $application) {
            if (! is_array($application)) {
                continue;
            }

            $title = trim((string) ($application['window_title'] ?? ''));

            if ($title === '' || $this->shouldExcludeTitle($title, $excludeTitle)) {
                continue;
            }

            $titles[] = $title;
        }

        return $titles;
    }

    /**
     * @param  list<array<string, mixed>>  $blocks
     * @return array<string, mixed>|null
     */
    private function bestOverlappingBlock(
        array $blocks,
        int $startMinutes,
        int $endMinutes,
    ): ?array {
        $bestBlock = null;
        $bestOverlap = 0;

        foreach ($blocks as $block) {
            $overlap = $this->overlapMinutes($block, $startMinutes, $endMinutes);

            if ($overlap > $bestOverlap) {
                $bestOverlap = $overlap;
                $bestBlock = $block;
            }
        }

        return $bestBlock;
    }

    /**
     * @param  array<string, mixed>  $block
     */
    private function overlapMinutes(array $block, int $startMinutes, int $endMinutes): int
    {
        $blockStart = (int) ($block['start_minutes'] ?? 0);
        $blockEnd = (int) ($block['end_minutes'] ?? 0);

        $overlapStart = max($blockStart, $startMinutes);
        $overlapEnd = min($blockEnd, $endMinutes);

        return max(0, $overlapEnd - $overlapStart);
    }

    private function shouldExcludeTitle(string $title, ?string $excludeTitle): bool
    {
        if ($this->syntheticTitleFilter->shouldExclude($title)) {
            return true;
        }

        if ($excludeTitle === null || trim($excludeTitle) === '') {
            return false;
        }

        return strcasecmp($title, trim($excludeTitle)) === 0;
    }
}
