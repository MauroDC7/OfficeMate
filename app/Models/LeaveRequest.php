<?php

namespace App\Models;

use App\Enums\LeaveRequestStatus;
use Carbon\CarbonImmutable;
use Database\Factories\LeaveRequestFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @use HasFactory<LeaveRequestFactory>
 */
#[Fillable(['user_id', 'starts_on', 'ends_on', 'status', 'label'])]
class LeaveRequest extends Model
{
    /** @use HasFactory<LeaveRequestFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_on' => 'immutable_date:Y-m-d',
            'ends_on' => 'immutable_date:Y-m-d',
            'status' => LeaveRequestStatus::class,
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function dayCount(): int
    {
        $start = CarbonImmutable::parse($this->starts_on->format('Y-m-d'));
        $end = CarbonImmutable::parse($this->ends_on->format('Y-m-d'));

        return max(1, $start->diffInDays($end) + 1);
    }
}
