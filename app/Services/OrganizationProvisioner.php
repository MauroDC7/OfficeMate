<?php

namespace App\Services;

use App\Enums\TaskAvailability;
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
                'name' => trim($name),
            ]);

            $this->attachUserAsAdmin($user, $organization);

            return $organization;
        });
    }

    public function startNewFor(User $user, string $name): Organization
    {
        if ($user->organization_id === null) {
            throw ValidationException::withMessages([
                'name' => 'Gebruik “Organisatie aanmaken” in instellingen als je nog geen bedrijf hebt.',
            ]);
        }

        if ($user->role !== UserRole::Admin) {
            throw ValidationException::withMessages([
                'name' => 'Alleen beheerders kunnen een nieuw bedrijf starten.',
            ]);
        }

        $this->ensureAnotherAdminRemainsIfNeeded($user);

        return DB::transaction(function () use ($user, $name): Organization {
            $organization = Organization::query()->create([
                'name' => trim($name),
            ]);

            $user->teamMemberships()->delete();

            $this->attachUserAsAdmin($user, $organization);

            return $organization;
        });
    }

    private function attachUserAsAdmin(User $user, Organization $organization): void
    {
        $user->forceFill([
            'organization_id' => $organization->id,
            'organization_joined_at' => now(),
            'role' => UserRole::Admin,
            'employment_setup_completed_at' => null,
            'employment_profile_id' => null,
            'last_seen_at_office' => null,
            'task_availability' => TaskAvailability::OpenForTasks,
        ])->save();

        $this->employmentAssigner->applyOrganizationDefaults($user->fresh(), $organization);
    }

    private function ensureAnotherAdminRemainsIfNeeded(User $user): void
    {
        $organizationId = $user->organization_id;

        $hasOtherMembers = User::query()
            ->where('organization_id', $organizationId)
            ->whereKeyNot($user->id)
            ->exists();

        if (! $hasOtherMembers) {
            return;
        }

        $otherAdminCount = User::query()
            ->where('organization_id', $organizationId)
            ->where('role', UserRole::Admin)
            ->whereKeyNot($user->id)
            ->count();

        if ($otherAdminCount > 0) {
            return;
        }

        throw ValidationException::withMessages([
            'name' => 'Maak eerst een andere beheerder aan in je huidige bedrijf voordat je een nieuw bedrijf start.',
        ]);
    }
}
