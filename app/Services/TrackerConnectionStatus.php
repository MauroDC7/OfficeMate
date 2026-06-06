<?php

namespace App\Services;

use App\Models\DesktopActivity;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Carbon;

final class TrackerConnectionStatus
{
    private const string TOKEN_NAME = 'officemate-tracker';

    /**
     * @return array{
     *     is_connected: bool,
     *     is_active: bool,
     *     last_activity_at: string|null,
     *     last_activity_label: string|null,
     *     recent_activity_count_7d: int,
     * }
     */
    public function forUser(User $user): array
    {
        $isConnected = $user->tokens()
            ->where('name', self::TOKEN_NAME)
            ->exists();

        $lastActivity = DesktopActivity::query()
            ->where('user_id', $user->id)
            ->orderByDesc('ended_at')
            ->value('ended_at');

        $lastActivityAt = $lastActivity !== null
            ? Carbon::parse($lastActivity)->toIso8601String()
            : null;

        $timezone = config('services.timesheets.timezone', 'Europe/Brussels');
        $sevenDaysAgo = CarbonImmutable::now($timezone)->subDays(7)->startOfDay();

        $recentActivityCount = DesktopActivity::query()
            ->where('user_id', $user->id)
            ->where('ended_at', '>=', $sevenDaysAgo)
            ->count();

        $timezone = config('services.timesheets.timezone', 'Europe/Brussels');
        $isActive = $isConnected
            && $lastActivity !== null
            && CarbonImmutable::parse($lastActivity)->timezone($timezone)->greaterThan(
                CarbonImmutable::now($timezone)->subMinutes(20),
            );

        return [
            'is_connected' => $isConnected,
            'is_active' => $isActive,
            'last_activity_at' => $lastActivityAt,
            'last_activity_label' => $this->formatLastActivityLabel($lastActivity),
            'recent_activity_count_7d' => $recentActivityCount,
        ];
    }

    private function formatLastActivityLabel(mixed $lastActivity): ?string
    {
        if ($lastActivity === null) {
            return null;
        }

        $timezone = config('services.timesheets.timezone', 'Europe/Brussels');
        $endedAt = CarbonImmutable::parse($lastActivity)->timezone($timezone);
        $now = CarbonImmutable::now($timezone);

        if ($endedAt->isToday()) {
            return 'Vandaag om '.$endedAt->format('H:i');
        }

        if ($endedAt->isYesterday()) {
            return 'Gisteren om '.$endedAt->format('H:i');
        }

        return $endedAt->translatedFormat('j F Y, H:i');
    }
}
