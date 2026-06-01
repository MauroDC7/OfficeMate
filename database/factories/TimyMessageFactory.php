<?php

namespace Database\Factories;

use App\Models\TimyConversation;
use App\Models\TimyMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TimyMessage>
 */
class TimyMessageFactory extends Factory
{
    protected $model = TimyMessage::class;

    public function definition(): array
    {
        return [
            'timy_conversation_id' => TimyConversation::factory(),
            'role' => 'assistant',
            'content' => fake()->sentence(),
            'actions' => null,
        ];
    }

    public function user(): static
    {
        return $this->state(fn (): array => ['role' => 'user']);
    }

    public function assistant(): static
    {
        return $this->state(fn (): array => ['role' => 'assistant']);
    }
}
