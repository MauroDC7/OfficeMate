<?php

namespace App\Services;

use App\Models\User;
use App\Support\OfficeIpAddress;
use Illuminate\Support\Carbon;

final class RecordOfficePresence
{
    private const int THROTTLE_MINUTES = 5;

    public function forUser(User $user, ?string $ip): void
    {
        if ($ip === null || $user->organization_id === null) {
            return;
        }

        $user->loadMissing('organization:id,office_ip_addresses');

        if ($user->organization === null) {
            return;
        }

        /** @var list<string>|null $officeIpAddresses */
        $officeIpAddresses = $user->organization->office_ip_addresses;

        if ($officeIpAddresses === null || $officeIpAddresses === []) {
            return;
        }

        if (! OfficeIpAddress::matches($ip, $officeIpAddresses)) {
            return;
        }

        if ($user->last_seen_at_office !== null
            && $user->last_seen_at_office->greaterThan(Carbon::now()->subMinutes(self::THROTTLE_MINUTES))) {
            return;
        }

        $user->last_seen_at_office = Carbon::now();
        $user->save();
    }
}
