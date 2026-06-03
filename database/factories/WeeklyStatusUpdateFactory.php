<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\WeeklyStatusUpdate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WeeklyStatusUpdate>
 */
class WeeklyStatusUpdateFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'week_start' => now()->startOfWeek()->toDateString(),
            'difficult_this_week' => fake()->sentence(),
            'plans_next_week' => fake()->sentence(),
        ];
    }
}
