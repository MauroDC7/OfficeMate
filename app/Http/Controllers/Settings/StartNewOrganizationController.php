<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StartNewOrganizationRequest;
use App\Models\User;
use App\Services\OrganizationProvisioner;
use Illuminate\Http\RedirectResponse;

final class StartNewOrganizationController extends Controller
{
    public function __construct(
        private readonly OrganizationProvisioner $organizationProvisioner,
    ) {}

    public function __invoke(StartNewOrganizationRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $this->organizationProvisioner->startNewFor(
            $user,
            $request->validated('name'),
        );

        return redirect()
            ->route('teams')
            ->with('status', 'Nieuw bedrijf gestart. Teams en projecten beginnen hier opnieuw.');
    }
}
