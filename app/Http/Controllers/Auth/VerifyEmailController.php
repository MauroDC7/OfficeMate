<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

final class VerifyEmailController extends Controller
{
    public function notice(Request $request): Response
    {
        return Inertia::render('verify-email', [
            'email' => $request->user()?->email ?? $request->session()->get('registered_email'),
            'canResend' => $request->user() instanceof User,
        ]);
    }

    public function verify(Request $request, string $id, string $hash): RedirectResponse
    {
        $user = User::query()->findOrFail($id);

        if (! hash_equals($hash, sha1($user->getEmailForVerification()))) {
            abort(403);
        }

        if (! $request->hasValidSignature()) {
            abort(403);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        if (! Auth::check()) {
            Auth::login($user);
            $request->session()->regenerate();
        }

        return redirect()
            ->route('dashboard')
            ->with('status', 'Je e-mailadres is bevestigd. Welkom bij TimeTraq!');
    }

    public function resend(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        if ($user->hasVerifiedEmail()) {
            return redirect()->route('dashboard');
        }

        $user->sendEmailVerificationNotification();

        return back()->with('status', 'We hebben opnieuw een bevestigingsmail gestuurd.');
    }
}
