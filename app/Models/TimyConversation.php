<?php

namespace App\Models;

use Database\Factories\TimyConversationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class TimyConversation extends Model
{
    /** @use HasFactory<TimyConversationFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'title',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(TimyMessage::class);
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(TimyMessage::class)->latestOfMany();
    }
}
