<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OrganizationInviteService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;

final class GoogleAuthController extends Controller
{
    public function __construct(
        private readonly OrganizationInviteService $organizationInviteService,
    ) {}

    /**
     * Stuur de gebruiker naar Google voor OAuth-toestemming.
     */
    public function redirect(Request $request): RedirectResponse
    {
        if ($request->isMethod('post')) {
            $request->validate([
                'privacy_policy_accepted' => ['accepted'],
            ]);
            $request->session()->put('privacy_policy_accepted', true);
        }

        return Socialite::driver('google')->redirect();
    }

    /**
     * Ontvang de Google-callback, zoek of maak de gebruiker en log in.
     */
    public function callback(Request $request): RedirectResponse
    {
        if ($request->filled('error')) {
            return $this->failed('Google login werd geannuleerd.');
        }

        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (InvalidStateException) {
            return $this->failed('De login-sessie is verlopen. Probeer het opnieuw.');
        } catch (\Throwable) {
            return $this->failed('Inloggen met Google is mislukt. Probeer het opnieuw.');
        }

        $googleId = $googleUser->getId();
        $email = $googleUser->getEmail();

        if ($googleId === null || $googleId === '' || $email === null || $email === '') {
            return $this->failed('Google heeft geen e-mailadres teruggegeven. Probeer een ander account.');
        }

        $user = User::query()->where('google_id', $googleId)->first();

        if ($user === null) {
            $user = User::query()->where('email', $email)->first();

            if ($user !== null) {
                $user->update([
                    'google_id' => $googleId,
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ]);
            }
        }

        if ($user === null) {
            if (! $request->session()->pull('privacy_policy_accepted', false)) {
                return redirect()
                    ->route('register')
                    ->with(
                        'authError',
                        'Je moet eerst akkoord gaan met het privacybeleid voordat je een account kunt aanmaken.',
                    );
            }

            [$firstName, $lastName] = $this->splitName($googleUser->getName() ?? $email);

            $user = User::create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $email,
                'google_id' => $googleId,
                'password' => null,
                'role' => UserRole::Employee,
                'email_verified_at' => now(),
                'privacy_policy_accepted_at' => now(),
            ]);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        if ($this->organizationInviteService->tryAcceptFromSession($user)) {
            return redirect()
                ->intended(route('dashboard'))
                ->with('status', 'Je bent toegevoegd aan de organisatie.');
        }

        return redirect()->intended(route('dashboard'));
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function splitName(string $fullName): array
    {
        $trimmed = trim($fullName);

        if ($trimmed === '') {
            return ['Gebruiker', ''];
        }

        $parts = preg_split('/\s+/', $trimmed, 2);

        return [
            (string) ($parts[0] ?? 'Gebruiker'),
            (string) ($parts[1] ?? ''),
        ];
    }

    private function failed(string $message): RedirectResponse
    {
        return redirect()
            ->route('login')
            ->with('authError', $message);
    }
}
