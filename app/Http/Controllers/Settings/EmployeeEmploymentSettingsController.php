<?php

namespace App\Http\Controllers\Settings;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateEmployeeEmploymentSettingsRequest;
use App\Models\EmploymentProfile;
use App\Models\Organization;
use App\Models\User;
use App\Services\EmployeeEmploymentAssigner;
use App\Services\OrganizationContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

final class EmployeeEmploymentSettingsController extends Controller
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
        private readonly EmployeeEmploymentAssigner $employmentAssigner,
    ) {}

    public function update(UpdateEmployeeEmploymentSettingsRequest $request, User $user): RedirectResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($admin);
        abort_unless(
            $user->organization_id === $organization->id && $user->role === UserRole::Employee,
            404,
        );

        $validated = $request->validated();

        match ($validated['mode']) {
            'organization_default' => $this->employmentAssigner->applyOrganizationDefaults($user, $organization),
            'profile' => $this->applyProfileMode($user, $organization, (int) $validated['employment_profile_id']),
            'custom' => $this->employmentAssigner->applyCustom(
                $user,
                (int) $validated['weekly_work_hours'],
                (int) $validated['annual_leave_days'],
            ),
        };

        $user->forceFill(['employment_setup_completed_at' => now()])->save();

        return redirect()->route('settings');
    }

    private function applyProfileMode(User $user, Organization $organization, int $profileId): void
    {
        $profile = EmploymentProfile::query()
            ->where('organization_id', $organization->id)
            ->whereKey($profileId)
            ->first();

        if ($profile === null) {
            throw ValidationException::withMessages([
                'employment_profile_id' => 'Dit contracttype bestaat niet.',
            ]);
        }

        $this->employmentAssigner->applyProfile($user, $profile);
    }
}
