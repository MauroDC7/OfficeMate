<?php

namespace App\Models;

use Database\Factories\TimesheetEntryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @use HasFactory<TimesheetEntryFactory>
 */
#[Fillable(['project_id', 'title', 'description', 'client_name', 'worked_on', 'start_minutes', 'end_minutes'])]
class TimesheetEntry extends Model
{
    /** @use HasFactory<TimesheetEntryFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'worked_on' => 'immutable_date:Y-m-d',
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
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * True when [start, end) overlaps an existing entry on the same calendar day (half-open intervals as minutes 0–1440).
     */
    public static function overlapsForUserDay(int $userId, string $workedOnYmd, int $start, int $end, ?int $ignoreId = null): bool
    {
        if ($end <= $start) {
            return false;
        }

        return self::query()
            ->where('user_id', $userId)
            ->whereDate('worked_on', $workedOnYmd)
            ->when($ignoreId !== null, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->where('start_minutes', '<', $end)
            ->where('end_minutes', '>', $start)
            ->exists();
    }
}
