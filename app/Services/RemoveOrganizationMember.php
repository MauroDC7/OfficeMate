<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class RemoveOrganizationMember
{
    public function remove(User $admin, User $member): void
    {
        if ($admin->id === $member->id) {
            throw ValidationException::withMessages([
                'user' => 'Je kunt jezelf niet uit het bedrijf halen.',
            ]);
        }

        if ($member->role === UserRole::Admin) {
            $adminCount = User::query()
                ->where('organization_id', $member->organization_id)
                ->where('role', UserRole::Admin)
                ->count();

            if ($adminCount <= 1) {
                throw ValidationException::withMessages([
                    'user' => 'Er moet minstens één beheerder in het bedrijf blijven.',
                ]);
            }
        }

        DB::transaction(function () use ($member): void {
            $member->teamMemberships()->delete();

            $member->forceFill([
                'organization_id' => null,
                'organization_joined_at' => null,
                'employment_setup_completed_at' => null,
                'employment_profile_id' => null,
                'last_seen_at_office' => null,
                'role' => UserRole::Employee,
            ])->save();
        });
    }
}
