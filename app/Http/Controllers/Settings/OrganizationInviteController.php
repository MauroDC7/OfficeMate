<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreOrganizationInviteRequest;
use App\Models\User;
use App\Services\OrganizationContext;
use App\Services\OrganizationInviteService;
use Illuminate\Http\RedirectResponse;

final class OrganizationInviteController extends Controller
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
        private readonly OrganizationInviteService $organizationInviteService,
    ) {}

    public function store(StoreOrganizationInviteRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($user);

        $email = $request->validated('email');

        $this->organizationInviteService->send($organization, $user, $email);

        return redirect()
            ->route('teams')
            ->with('status', 'Uitnodiging verstuurd naar '.$email.'.');
    }
}
