<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateOrganizationRequest;
use App\Models\User;
use App\Services\OrganizationContext;
use Illuminate\Http\RedirectResponse;

final class OrganizationSettingsController extends Controller
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
    ) {}

    public function __invoke(UpdateOrganizationRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($user);

        $organization->update([
            'name' => $request->validated('name'),
        ]);

        return redirect()
            ->route('teams')
            ->with('status', 'Bedrijfsnaam opgeslagen.');
    }
}
