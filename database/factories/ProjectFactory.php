<?php

namespace Database\Factories;

use App\Enums\ProjectStatus;
use App\Enums\ProjectType;
use App\Models\Organization;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'organization_id' => Organization::factory(),
            'name' => fake()->words(3, true),
            'type' => ProjectType::External,
            'status' => fake()->randomElement(ProjectStatus::cases()),
            'hours_budget' => fake()->optional(0.7)->numberBetween(100, 2000),
            'client_name' => fake()->company(),
            'created_by' => null,
            'is_active' => true,
        ];
    }

    public function internal(): static
    {
        return $this->state(fn (): array => [
            'type' => ProjectType::Internal,
            'client_name' => null,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => [
            'is_active' => false,
        ]);
    }
}
