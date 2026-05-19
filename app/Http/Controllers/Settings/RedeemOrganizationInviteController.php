<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\RedeemOrganizationInviteRequest;
use App\Models\User;
use App\Services\OrganizationInviteService;
use Illuminate\Http\RedirectResponse;

final class RedeemOrganizationInviteController extends Controller
{
    public function __construct(
        private readonly OrganizationInviteService $organizationInviteService,
    ) {}

    public function __invoke(RedeemOrganizationInviteRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $this->organizationInviteService->redeem(
            $user,
            $request->validated('code'),
        );

        return redirect()
            ->route('settings')
            ->with('status', 'Je bent toegevoegd aan de organisatie.');
    }
}
