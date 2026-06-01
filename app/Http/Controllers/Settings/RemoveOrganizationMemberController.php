<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OrganizationContext;
use App\Services\RemoveOrganizationMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class RemoveOrganizationMemberController extends Controller
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
        private readonly RemoveOrganizationMember $removeOrganizationMember,
    ) {}

    public function __invoke(Request $request, User $user): RedirectResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($admin);
        abort_unless($user->organization_id === $organization->id, 404);

        $this->removeOrganizationMember->remove($admin, $user);

        return redirect()
            ->route('settings')
            ->with('status', 'Medewerker is uit het bedrijf gehaald.');
    }
}
