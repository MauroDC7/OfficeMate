<?php

namespace App\Services;

use App\Models\User;
use Carbon\CarbonImmutable;

final class OfficePresenceResolver
{
    public function isInOffice(User $user): bool
    {
        if ($user->last_seen_at_office === null) {
            return false;
        }

        $timezone = config('services.timesheets.timezone', 'Europe/Brussels');
        $seenAt = CarbonImmutable::parse($user->last_seen_at_office)->timezone($timezone);
        $today = CarbonImmutable::now($timezone)->startOfDay();

        return $seenAt->greaterThanOrEqualTo($today);
    }
}
