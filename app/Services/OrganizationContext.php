<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\User;

final class OrganizationContext
{
    public function forUser(User $user): ?Organization
    {
        if ($user->organization_id !== null) {
            return Organization::query()->find($user->organization_id);
        }

        if ($user->role === UserRole::Admin) {
            $organization = Organization::query()->firstOrCreate(
                [],
                ['name' => ''],
            );

            if ($user->organization_id !== $organization->id) {
                $user->forceFill(['organization_id' => $organization->id])->save();
            }

            return $organization;
        }

        return null;
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
