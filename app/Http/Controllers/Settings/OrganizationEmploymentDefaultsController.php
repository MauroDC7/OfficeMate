<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateOrganizationEmploymentDefaultsRequest;
use App\Models\User;
use App\Services\OrganizationContext;
use Illuminate\Http\RedirectResponse;

final class OrganizationEmploymentDefaultsController extends Controller
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
    ) {}

    public function __invoke(UpdateOrganizationEmploymentDefaultsRequest $request): RedirectResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($admin);
        $organization->update($request->validated());

        return redirect()->route('settings');
    }
}
