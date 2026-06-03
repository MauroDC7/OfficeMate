<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreOrganizationRequest;
use App\Models\User;
use App\Services\OrganizationProvisioner;
use Illuminate\Http\RedirectResponse;

final class StoreOrganizationController extends Controller
{
    public function __construct(
        private readonly OrganizationProvisioner $organizationProvisioner,
    ) {}

    public function __invoke(StoreOrganizationRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $this->organizationProvisioner->createFor(
            $user,
            trim($request->validated('name')),
        );

        return redirect()
            ->route('settings')
            ->with('status', 'Organisatie aangemaakt. Je bent nu beheerder.');
    }
}
