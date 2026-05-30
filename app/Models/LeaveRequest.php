<?php

namespace App\Models;

use App\Enums\LeaveRequestStatus;
use App\Enums\LeaveType;
use Carbon\CarbonImmutable;
use Database\Factories\LeaveRequestFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @use HasFactory<LeaveRequestFactory>
 */
#[Fillable(['user_id', 'starts_on', 'ends_on', 'type', 'notes', 'status', 'rejection_reason'])]
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
            'type' => LeaveType::class,
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

    /**
     * @return HasMany<LeaveRequestAttachment, $this>
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(LeaveRequestAttachment::class);
    }

    public function dayCount(): int
    {
        $start = CarbonImmutable::parse($this->starts_on->format('Y-m-d'));
        $end = CarbonImmutable::parse($this->ends_on->format('Y-m-d'));

        return max(1, $start->diffInDays($end) + 1);
    }

    public function isPending(): bool
    {
        return $this->status === LeaveRequestStatus::Pending;
    }
}
