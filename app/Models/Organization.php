<?php

namespace App\Models;

use Database\Factories\OrganizationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @use HasFactory<OrganizationFactory>
 */
#[Fillable([
    'name',
    'default_weekly_work_hours',
    'default_annual_leave_days',
])]
class Organization extends Model
{
    /** @use HasFactory<OrganizationFactory> */
    use HasFactory;

    /**
     * @return HasMany<EmploymentProfile, $this>
     */
    public function employmentProfiles(): HasMany
    {
        return $this->hasMany(EmploymentProfile::class)->orderBy('name');
    }

    /**
     * @return HasMany<Team, $this>
     */
    public function teams(): HasMany
    {
        return $this->hasMany(Team::class);
    }

    /**
     * @return HasMany<OrganizationInvite, $this>
     */
    public function invites(): HasMany
    {
        return $this->hasMany(OrganizationInvite::class);
    }
}
