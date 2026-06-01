<?php

namespace App\Models;

use Database\Factories\TimyMessageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimyMessage extends Model
{
    /** @use HasFactory<TimyMessageFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'timy_conversation_id',
        'role',
        'content',
        'actions',
        'pending_action',
    ];

    protected function casts(): array
    {
        return [
            'actions' => 'array',
            'pending_action' => 'array',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(TimyConversation::class, 'timy_conversation_id');
    }
}
