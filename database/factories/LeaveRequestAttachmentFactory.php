<?php

namespace Database\Factories;

use App\Models\LeaveRequest;
use App\Models\LeaveRequestAttachment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeaveRequestAttachment>
 */
class LeaveRequestAttachmentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'leave_request_id' => LeaveRequest::factory()->sick(),
            'path' => 'leave-attachments/'.fake()->uuid().'.pdf',
            'original_name' => 'doktersbrief.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => fake()->numberBetween(10_000, 500_000),
        ];
    }
}
