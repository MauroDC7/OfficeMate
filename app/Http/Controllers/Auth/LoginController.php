<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\OrganizationInviteService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function __construct(
        private readonly OrganizationInviteService $organizationInviteService,
    ) {}

    public function create(): Response
    {
        return Inertia::render('login');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (! Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => 'De combinatie van e-mailadres en wachtwoord is niet juist.',
            ]);
        }

        $request->session()->regenerate();

        $user = Auth::user();

        if ($user !== null && $this->organizationInviteService->tryAcceptFromSession($user)) {
            return redirect()
                ->intended(route('dashboard'))
                ->with('status', 'Je bent toegevoegd aan de organisatie.');
        }

        return redirect()->intended(route('dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
