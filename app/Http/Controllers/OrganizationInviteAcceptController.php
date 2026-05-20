<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\OrganizationInviteService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

final class OrganizationInviteAcceptController extends Controller
{
    public function __construct(
        private readonly OrganizationInviteService $organizationInviteService,
    ) {}

    public function __invoke(Request $request, string $token): RedirectResponse
    {
        $invite = $this->organizationInviteService->findValidInvite($token);

        if ($invite === null) {
            return redirect()
                ->route('login')
                ->with('authError', 'Deze uitnodiging is ongeldig of verlopen.');
        }

        $request->session()->put('organization_invite_token', $token);

        $user = $request->user();

        if ($user instanceof User) {
            return $this->acceptForAuthenticatedUser($request, $user, $token);
        }

        if (User::query()->where('email', $invite->email)->exists()) {
            return redirect()
                ->route('login')
                ->with('status', 'Log in met '.$invite->email.' om de uitnodiging te accepteren.');
        }

        return redirect()
            ->route('register')
            ->with('status', 'Maak een account aan om de uitnodiging te accepteren.');
    }

    private function acceptForAuthenticatedUser(Request $request, User $user, string $token): RedirectResponse
    {
        try {
            $this->organizationInviteService->accept($user, $token);
        } catch (ValidationException $exception) {
            $message = $exception->validator->errors()->first() ?? 'Uitnodiging kon niet worden geaccepteerd.';

            return redirect()
                ->route('settings')
                ->with('authError', $message);
        }

        $request->session()->forget('organization_invite_token');

        return redirect()
            ->route('dashboard')
            ->with('status', 'Je bent toegevoegd aan de organisatie.');
    }
}
