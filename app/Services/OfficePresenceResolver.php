<?php

namespace App\Services;

use App\Models\User;

final class OfficePresenceResolver
{
    public function isInOffice(User $user): bool
    {
        unset($user);

        return false;
    }
}
