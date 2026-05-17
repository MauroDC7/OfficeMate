<?php

namespace App\Models;

use Database\Factories\DesktopActivityFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @use HasFactory<DesktopActivityFactory>
 */
#[Fillable([
    'user_id',
    'app_name',
    'window_title',
    'browser_url',
    'browser_domain',
    'browser_tab_title',
    'started_at',
    'ended_at',
    'duration_seconds',
])]
class DesktopActivity extends Model
{
    /** @use HasFactory<DesktopActivityFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'duration_seconds' => 'integer',
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
