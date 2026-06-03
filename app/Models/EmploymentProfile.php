<?php

namespace App\Models;

use Database\Factories\EmploymentProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @use HasFactory<EmploymentProfileFactory>
 */
#[Fillable(['organization_id', 'name', 'weekly_work_hours', 'annual_leave_days'])]
class EmploymentProfile extends Model
{
    public const int MAX_PER_ORGANIZATION = 5;

    /** @use HasFactory<EmploymentProfileFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Organization, $this>
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
