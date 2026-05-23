<?php

namespace Database\Factories;

use App\Models\DesktopActivity;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<DesktopActivity>
 */
class DesktopActivityFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $duration = fake()->numberBetween(30, 600);
        $startedAt = Carbon::now()->subSeconds(fake()->numberBetween(0, 3600));
        $endedAt = (clone $startedAt)->addSeconds($duration);

        return [
            'user_id' => User::factory(),
            'app_name' => fake()->randomElement(['Code.exe', 'Chrome.exe', 'Slack.exe', 'Terminal.app']),
            'window_title' => fake()->sentence(4),
            'browser_url' => fake()->optional(0.5)->url(),
            'browser_domain' => fake()->optional(0.5)->domainName(),
            'browser_tab_title' => fake()->optional(0.5)->sentence(3),
            'started_at' => $startedAt,
            'ended_at' => $endedAt,
            'duration_seconds' => $duration,
        ];
    }
}
