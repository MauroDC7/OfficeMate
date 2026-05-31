<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreEmploymentProfileRequest;
use App\Http\Requests\Settings\UpdateEmploymentProfileRequest;
use App\Models\EmploymentProfile;
use App\Models\Organization;
use App\Models\User;
use App\Services\EmployeeEmploymentAssigner;
use App\Services\OrganizationContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

final class EmploymentProfileController extends Controller
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
        private readonly EmployeeEmploymentAssigner $employmentAssigner,
    ) {}

    public function store(StoreEmploymentProfileRequest $request): RedirectResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($admin);

        if ($organization->employmentProfiles()->count() >= EmploymentProfile::MAX_PER_ORGANIZATION) {
            throw ValidationException::withMessages([
                'name' => 'Je kunt maximaal '.EmploymentProfile::MAX_PER_ORGANIZATION.' contracttypes aanmaken.',
            ]);
        }

        $organization->employmentProfiles()->create($request->validated());

        return redirect()->route('settings');
    }

    public function update(UpdateEmploymentProfileRequest $request, EmploymentProfile $employment_profile): RedirectResponse
    {
        $organization = $this->resolveOrganization($request, $employment_profile);
        $employment_profile->update($request->validated());

        $employment_profile->users()->each(
            fn (User $employee) => $this->employmentAssigner->applyProfile($employee, $employment_profile),
        );

        return redirect()->route('settings');
    }

    public function destroy(Request $request, EmploymentProfile $employment_profile): RedirectResponse
    {
        $organization = $this->resolveOrganization($request, $employment_profile);

        $employment_profile->users()->each(
            fn (User $employee) => $this->employmentAssigner->applyOrganizationDefaults($employee, $organization),
        );

        $employment_profile->delete();

        return redirect()->route('settings');
    }

    private function resolveOrganization(Request $request, EmploymentProfile $employment_profile): Organization
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($admin);
        abort_unless($employment_profile->organization_id === $organization->id, 404);

        return $organization;
    }
}
