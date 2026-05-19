<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\OrganizationInvite;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class OrganizationInviteService
{
    public function generate(Organization $organization, User $createdBy): string
    {
        $code = $this->uniqueCode();

        OrganizationInvite::query()->create([
            'organization_id' => $organization->id,
            'code' => $code,
            'created_by_user_id' => $createdBy->id,
        ]);

        return $code;
    }

    public function redeem(User $user, string $rawCode): Organization
    {
        if ($user->organization_id !== null) {
            throw ValidationException::withMessages([
                'code' => 'Je bent al gekoppeld aan een organisatie.',
            ]);
        }

        $code = strtoupper(trim($rawCode));

        if ($code === '') {
            throw ValidationException::withMessages([
                'code' => 'Voer een uitnodigingscode in.',
            ]);
        }

        $invite = OrganizationInvite::query()
            ->where('code', $code)
            ->whereNull('redeemed_at')
            ->first();

        if ($invite === null) {
            throw ValidationException::withMessages([
                'code' => 'Deze code is ongeldig of al gebruikt.',
            ]);
        }

        return DB::transaction(function () use ($user, $invite): Organization {
            $user->forceFill(['organization_id' => $invite->organization_id])->save();

            $invite->update([
                'redeemed_at' => now(),
                'redeemed_by_user_id' => $user->id,
            ]);

            return $invite->organization()->firstOrFail();
        });
    }

    private function uniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (OrganizationInvite::query()->where('code', $code)->exists());

        return $code;
    }
}
