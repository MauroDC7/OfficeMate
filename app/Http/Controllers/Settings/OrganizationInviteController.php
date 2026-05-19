<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OrganizationContext;
use App\Services\OrganizationInviteService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class OrganizationInviteController extends Controller
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
        private readonly OrganizationInviteService $organizationInviteService,
    ) {}

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($user);

        $code = $this->organizationInviteService->generate($organization, $user);

        return redirect()
            ->route('settings')
            ->with('organizationInviteCode', $code);
    }
}
