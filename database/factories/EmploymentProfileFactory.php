<?php

namespace Database\Factories;

use App\Models\EmploymentProfile;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmploymentProfile>
 */
class EmploymentProfileFactory extends Factory
{
    protected $model = EmploymentProfile::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'organization_id' => Organization::factory(),
            'name' => fake()->unique()->words(2, true),
            'weekly_work_hours' => 40,
            'annual_leave_days' => 25,
        ];
    }
}
