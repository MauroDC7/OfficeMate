<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => 'Voornaam',
            'last_name' => 'Achternaam',
            'username' => null,
            'email' => 'user-'.Str::lower(Str::random(12)).'@example.com',
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'role' => UserRole::Employee,
            'tracker_use_ai_for_proposals' => true,
            'tracker_tracking_enabled' => true,
            'tracker_blocklist' => [],
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function forOrganization(Organization $organization): static
    {
        return $this->state(fn (array $attributes) => [
            'organization_id' => $organization->id,
        ]);
    }

    public function admin(?Organization $organization = null): static
    {
        return $this->state(function (array $attributes) use ($organization): array {
            $organization ??= Organization::factory()->create();

            return [
                'role' => UserRole::Admin,
                'organization_id' => $organization->id,
                'organization_joined_at' => now(),
            ];
        });
    }
}
