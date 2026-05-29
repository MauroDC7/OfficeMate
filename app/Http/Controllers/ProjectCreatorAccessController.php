<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\OrganizationContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class ProjectCreatorAccessController extends Controller
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
    ) {}

    public function update(Request $request, User $user): RedirectResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($admin);
        abort_unless($user->organization_id === $organization->id, 404);

        $validated = $request->validate([
            'can_create_projects' => ['required', 'boolean'],
        ]);

        $user->forceFill(['can_create_projects' => $validated['can_create_projects']])->save();

        return redirect()->route('projects');
    }
}
