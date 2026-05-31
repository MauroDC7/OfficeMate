<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\OrganizationInvite;
use App\Models\User;
use App\Services\OrganizationInviteService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisterController extends Controller
{
    public function __construct(
        private readonly OrganizationInviteService $organizationInviteService,
    ) {}

    public function create(Request $request): Response
    {
        $inviteEmail = $this->inviteEmailFromSession($request);

        return Inertia::render('register', [
            'inviteEmail' => $inviteEmail,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $invite = $this->inviteFromSession($request);

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'privacy_policy_accepted' => ['accepted'],
        ]);

        if ($invite !== null && strcasecmp($validated['email'], $invite->email) !== 0) {
            throw ValidationException::withMessages([
                'email' => 'Gebruik het e-mailadres waar de uitnodiging naartoe is gestuurd.',
            ]);
        }

        $user = User::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'privacy_policy_accepted_at' => now(),
            'role' => UserRole::Employee,
        ]);

        $user->sendEmailVerificationNotification();

        Auth::login($user);

        $request->session()->regenerate();

        if ($invite !== null) {
            $token = $request->session()->get('organization_invite_token');
            abort_unless(is_string($token) && $token !== '', 403);

            $this->organizationInviteService->accept($user, $token);
            $request->session()->forget('organization_invite_token');
        }

        return redirect()
            ->route('verification.notice')
            ->with('status', 'Welkom! Bevestig je e-mailadres via de link in je inbox om je account te activeren.');
    }

    private function inviteFromSession(Request $request): ?OrganizationInvite
    {
        $token = $request->session()->get('organization_invite_token');

        if (! is_string($token) || $token === '') {
            return null;
        }

        return $this->organizationInviteService->findValidInvite($token);
    }

    private function inviteEmailFromSession(Request $request): ?string
    {
        return $this->inviteFromSession($request)?->email;
    }
}
