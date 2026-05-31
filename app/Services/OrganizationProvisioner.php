<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class OrganizationProvisioner
{
    public function __construct(
        private readonly EmployeeEmploymentAssigner $employmentAssigner,
    ) {}

    public function createFor(User $user, string $name): Organization
    {
        if ($user->organization_id !== null) {
            throw ValidationException::withMessages([
                'name' => 'Je bent al gekoppeld aan een organisatie.',
            ]);
        }

        return DB::transaction(function () use ($user, $name): Organization {
            $organization = Organization::query()->create([
                'name' => $name,
            ]);

            $user->forceFill([
                'organization_id' => $organization->id,
                'organization_joined_at' => now(),
                'role' => UserRole::Admin,
                'employment_setup_completed_at' => null,
            ])->save();

            $this->employmentAssigner->applyOrganizationDefaults($user->fresh(), $organization);

            return $organization;
        });
    }
}
