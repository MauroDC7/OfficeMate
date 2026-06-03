<?php

namespace App\Services;

use App\Models\DesktopActivity;
use App\Models\User;
use Carbon\CarbonImmutable;

/**
 * Builds work blocks from TimeTraq Tracker rows in desktop_activities.
 */
final class DesktopActivityWorkBlockLoader
{
    public function __construct(
        private readonly WorkBlockCoalescer $coalescer,
        private readonly TrackerBlocklistMatcher $blocklistMatcher,
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
        User $user,
        CarbonImmutable $rangeStart,
        CarbonImmutable $rangeEnd,
        ?string $timezone = null,
    ): array {
        $tz = $timezone ?? $this->timesheetTimezone();
        $from = $rangeStart->setTimezone($tz)->startOfDay()->utc();
        $to = $rangeEnd->setTimezone($tz)->endOfDay()->utc();

        $blocklist = $this->blocklistMatcher->normalizeBlocklist($user->tracker_blocklist);

        $events = DesktopActivity::query()
            ->where('user_id', $user->id)
            ->where('started_at', '>=', $from)
            ->where('started_at', '<=', $to)
            ->orderBy('started_at')
            ->get()
            ->map(fn (DesktopActivity $activity): ?array => $this->normaliseActivity($activity, $tz, $blocklist))
            ->filter()
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
    public function loadWorkBlocksForDay(User $user, CarbonImmutable $day, ?string $timezone = null): array
    {
        return $this->loadWorkBlocksForRange($user, $day, $day, $timezone);
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
    public function loadWorkBlocksForWeek(User $user, CarbonImmutable $weekMonday, ?string $timezone = null): array
    {
        return $this->loadWorkBlocksForRange($user, $weekMonday, $weekMonday->addDays(6), $timezone);
    }

    /**
     * @return array{
     *     start: CarbonImmutable,
     *     end: CarbonImmutable,
     *     application: string,
     *     window_title: string,
     *     duration: float
     * }|null
     */
    /**
     * @param  list<string>  $blocklist
     */
    private function normaliseActivity(DesktopActivity $activity, string $timezone, array $blocklist): ?array
    {
        $application = $this->coalescer->stripInvisibleChars($activity->app_name);

        if ($application === '' || $this->coalescer->isIgnoredApp($application)) {
            return null;
        }

        $windowTitle = filled($activity->browser_tab_title)
            ? $this->coalescer->stripInvisibleChars($activity->browser_tab_title)
            : $this->coalescer->stripInvisibleChars($activity->window_title);

        if ($windowTitle === '') {
            $windowTitle = $application;
        }

        if ($this->blocklistMatcher->matches(
            $blocklist,
            $application,
            $this->coalescer->stripInvisibleChars($activity->window_title),
            $this->coalescer->stripInvisibleChars((string) $activity->browser_tab_title),
            $this->coalescer->stripInvisibleChars((string) $activity->browser_domain),
        )) {
            return null;
        }

        if (filled($activity->browser_domain)) {
            $windowTitle .= ' ('.$activity->browser_domain.')';
        }

        $duration = (float) $activity->duration_seconds;

        if ($duration <= 0) {
            return null;
        }

        $start = $activity->started_at->toImmutable()->setTimezone($timezone);
        $end = $activity->ended_at->toImmutable()->setTimezone($timezone);

        return [
            'start' => $start,
            'end' => $end,
            'application' => $application,
            'window_title' => $windowTitle,
            'duration' => $duration,
        ];
    }

    private function timesheetTimezone(): string
    {
        $configured = config('services.timesheets.timezone');

        return is_string($configured) && $configured !== ''
            ? $configured
            : 'Europe/Brussels';
    }
}
