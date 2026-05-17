<?php

namespace App\Models;

use Database\Factories\TimesheetEntryProposalFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @use HasFactory<TimesheetEntryProposalFactory>
 */
#[Fillable([
    'user_id',
    'worked_on',
    'title',
    'description',
    'client_name',
    'start_minutes',
    'end_minutes',
    'source',
])]
class TimesheetEntryProposal extends Model
{
    /** @use HasFactory<TimesheetEntryProposalFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'worked_on' => 'immutable_date:Y-m-d',
            'start_minutes' => 'integer',
            'end_minutes' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
