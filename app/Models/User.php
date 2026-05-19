<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['first_name', 'last_name', 'username', 'email', 'google_id', 'password', 'role'])]
#[Hidden(['password', 'remember_token', 'avatar_path'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

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
            'password' => 'hashed',
            'role' => UserRole::class,
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
     * @return HasMany<LeaveRequest, $this>
     */
    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }
}
