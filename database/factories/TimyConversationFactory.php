<?php

namespace Database\Factories;

use App\Models\TimyConversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TimyConversation>
 */
class TimyConversationFactory extends Factory
{
    protected $model = TimyConversation::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => null,
        ];
    }
}
