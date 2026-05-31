<?php

namespace App\Models;

use App\Enums\TaskAvailability;
use App\Enums\UserRole;
use App\Notifications\ResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;
use Database\Factories\UserFactory;
use Illuminate\Auth\MustVerifyEmail;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'first_name',
    'last_name',
    'username',
    'email',
    'google_id',
    'password',
    'role',
    'can_create_projects',
    'annual_leave_days',
    'weekly_work_hours',
    'employment_profile_id',
    'organization_id',
    'organization_joined_at',
    'employment_setup_completed_at',
    'privacy_policy_accepted_at',
    'task_availability',
])]
#[Hidden(['password', 'remember_token', 'avatar_path'])]
class User extends Authenticatable implements CanResetPasswordContract, MustVerifyEmailContract
{
    /** @use HasFactory<UserFactory> */
    use CanResetPassword, HasApiTokens, HasFactory, MustVerifyEmail, Notifiable;

    /**
     * @var list<string>
     */
    protected $appends = [
        'avatar',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'organization_joined_at' => 'datetime',
            'employment_setup_completed_at' => 'datetime',
            'last_seen_at_office' => 'datetime',
            'privacy_policy_accepted_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'task_availability' => TaskAvailability::class,
            'can_create_projects' => 'boolean',
        ];
    }

    /**
     * Volledige naam voor weergave (bijv. header, serialisatie naar Inertia).
     */
    protected function name(): Attribute
    {
        return Attribute::get(fn (): string => trim($this->first_name.' '.$this->last_name));
    }

    /**
     * Publieke URL van de profielfoto, of null als er geen foto is.
     */
    protected function avatar(): Attribute
    {
        return Attribute::get(function (): ?string {
            $path = $this->avatar_path;

            if ($path === null || $path === '') {
                return null;
            }

            return Storage::disk('public')->url($path);
        });
    }

    /**
     * @return BelongsTo<Organization, $this>
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * @return HasMany<TimesheetEntry, $this>
     */
    public function timesheetEntries(): HasMany
    {
        return $this->hasMany(TimesheetEntry::class);
    }

    /**
     * @return HasMany<TimesheetEntryProposal, $this>
     */
    public function timesheetEntryProposals(): HasMany
    {
        return $this->hasMany(TimesheetEntryProposal::class);
    }

    /**
     * @return HasMany<DesktopActivity, $this>
     */
    public function desktopActivities(): HasMany
    {
        return $this->hasMany(DesktopActivity::class);
    }

    /**
     * @return BelongsTo<EmploymentProfile, $this>
     */
    public function employmentProfile(): BelongsTo
    {
        return $this->belongsTo(EmploymentProfile::class);
    }

    /**
     * @return HasMany<LeaveRequest, $this>
     */
    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    /**
     * @return HasMany<TeamMembership, $this>
     */
    public function teamMemberships(): HasMany
    {
        return $this->hasMany(TeamMembership::class);
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailNotification);
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}
