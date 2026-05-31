<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\User;

final class OrganizationContext
{
    public function forUser(User $user): ?Organization
    {
        if ($user->organization_id === null) {
            return null;
        }

        return Organization::query()->find($user->organization_id);
    }

    public function forUserOrFail(User $user): Organization
    {
        $organization = $this->forUser($user);

        abort_if(
            $organization === null,
            403,
            'Koppel eerst je account aan een organisatie via Instellingen.',
        );

        return $organization;
    }
}
