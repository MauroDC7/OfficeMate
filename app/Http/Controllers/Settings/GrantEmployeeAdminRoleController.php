<?php

namespace App\Http\Controllers\Settings;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OrganizationContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class GrantEmployeeAdminRoleController extends Controller
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
    ) {}

    public function __invoke(Request $request, User $user): RedirectResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($admin);
        abort_unless(
            $user->organization_id === $organization->id && $user->role === UserRole::Employee,
            404,
        );

        $user->forceFill(['role' => UserRole::Admin])->save();

        return redirect()
            ->route('settings')
            ->with('status', 'Beheerdersrechten toegekend.');
    }
}
