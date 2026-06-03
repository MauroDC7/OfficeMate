<?php

namespace App\Models;

use Database\Factories\OrganizationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * @use HasFactory<OrganizationFactory>
 */
#[Fillable([
    'name',
    'default_weekly_work_hours',
    'default_annual_leave_days',
    'office_ip_addresses',
])]
class Organization extends Model
{
    /** @use HasFactory<OrganizationFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::saving(function (Organization $organization): void {
            $organization->name_normalized = self::normalizedName($organization->name);
        });
    }

    public static function normalizedName(string $name): string
    {
        return Str::lower(trim($name));
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'office_ip_addresses' => 'array',
        ];
    }

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
