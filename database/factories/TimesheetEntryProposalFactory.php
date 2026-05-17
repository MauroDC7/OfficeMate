<?php

namespace Database\Factories;

use App\Models\TimesheetEntryProposal;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TimesheetEntryProposal>
 */
class TimesheetEntryProposalFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = fake()->numberBetween(8 * 60, 14 * 60);
        $end = min($start + fake()->randomElement([30, 60, 90, 120]), 23 * 60 + 30);

        return [
            'user_id' => User::factory(),
            'worked_on' => now()->startOfWeek()->addDays(fake()->numberBetween(0, 4)),
            'title' => fake()->sentence(3),
            'description' => fake()->optional(0.6)->paragraph(),
            'client_name' => fake()->optional(0.4)->company(),
            'start_minutes' => $start,
            'end_minutes' => $end,
            'source' => 'activitywatch',
        ];
    }
}
