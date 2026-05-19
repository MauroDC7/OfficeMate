<?php

namespace Database\Factories;

use App\Enums\LeaveRequestStatus;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeaveRequest>
 */
class LeaveRequestFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startsOn = now()->addDays(fake()->numberBetween(5, 30))->startOfDay();
        $endsOn = (clone $startsOn)->addDays(fake()->numberBetween(0, 4));

        return [
            'user_id' => User::factory(),
            'starts_on' => $startsOn,
            'ends_on' => $endsOn,
            'status' => LeaveRequestStatus::Pending,
            'label' => fake()->randomElement(['Vakantie', 'Persoonlijk verlof', 'Ziekte']),
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (): array => [
            'status' => LeaveRequestStatus::Approved,
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (): array => [
            'status' => LeaveRequestStatus::Pending,
        ]);
    }
}
