<?php

declare(strict_types=1);

namespace App\Services\Slack;

use App\Models\Organization;
use App\Models\User;
use App\Models\WeeklyStatusUpdate;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

final class WeeklyDebriefSlackNotifier
{
    private const int MAX_PENDING_NAMES = 8;

    public function __construct(
        private readonly SlackIncomingWebhook $slackIncomingWebhook,
    ) {}

    public function isEnabled(): bool
    {
        if (! config('services.slack.weekly_debrief_reminders', true)) {
            return false;
        }

        return $this->slackIncomingWebhook->isConfigured();
    }

    public function sendReminderDigest(Organization $organization, CarbonImmutable $weekStart): bool
    {
        if (! $this->isEnabled()) {
            return false;
        }

        $weekStart = $weekStart->startOfWeek(CarbonImmutable::MONDAY);
        $cacheKey = 'weekly-debrief-slack-digest:'.$organization->id.':'.$weekStart->toDateString();

        if (Cache::has($cacheKey)) {
            return false;
        }

        $members = User::query()
            ->where('organization_id', $organization->id)
            ->whereNotNull('email_verified_at')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name']);

        if ($members->isEmpty()) {
            return false;
        }

        $submittedUserIds = WeeklyStatusUpdate::query()
            ->whereDate('week_start', $weekStart->toDateString())
            ->whereIn('user_id', $members->pluck('id'))
            ->pluck('user_id');

        $pending = $members->filter(
            fn (User $member): bool => ! $submittedUserIds->contains($member->id),
        );

        $text = $this->formatMessage(
            organizationName: $organization->name,
            weekStart: $weekStart,
            submittedCount: $members->count() - $pending->count(),
            totalCount: $members->count(),
            pending: $pending,
        );

        $sent = $this->slackIncomingWebhook->send(
            $text,
            username: config('app.name', 'TimeTraq'),
            iconEmoji: ':clipboard:',
        );

        if ($sent) {
            Cache::put($cacheKey, true, $weekStart->endOfWeek());
        }

        return $sent;
    }

    /**
     * @param  Collection<int, User>  $pending
     */
    private function formatMessage(
        string $organizationName,
        CarbonImmutable $weekStart,
        int $submittedCount,
        int $totalCount,
        Collection $pending,
    ): string {
        $weekEnd = $weekStart->addDays(6);
        $weekLabel = $weekStart->format('d-m-Y').' – '.$weekEnd->format('d-m-Y');
        $appName = config('app.name', 'TimeTraq');
        $adminUrl = url(route('admin.weeklyDebrief', ['week' => $weekStart->toDateString()]));

        $header = sprintf(
            '*%s* — weekstatus *%s* (%s): %d/%d ingevuld.',
            $appName,
            $organizationName,
            $weekLabel,
            $submittedCount,
            $totalCount,
        );

        if ($pending->isEmpty()) {
            return $header."\nIedereen heeft ingevuld. ".sprintf('<%s|Bekijk weekstatus>', $adminUrl);
        }

        $names = $pending
            ->map(fn (User $user): string => $user->name)
            ->values();

        $visibleNames = $names->take(self::MAX_PENDING_NAMES);
        $remaining = $names->count() - $visibleNames->count();

        $pendingLine = 'Nog open: '.$visibleNames->implode(', ');

        if ($remaining > 0) {
            $pendingLine .= sprintf(' (+%d anderen)', $remaining);
        }

        return $header."\n".$pendingLine."\n".sprintf('<%s|Bekijk weekstatus>', $adminUrl);
    }
}
