<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

final class DesktopAuthController extends Controller
{
    /**
     * Naam van de Sanctum-token die wordt aangemaakt voor de desktop tracker.
     * Wordt ook gebruikt om oude tokens te revoken bij een nieuwe login.
     */
    private const string TOKEN_NAME = 'officemate-tracker';

    /**
     * Geef een persoonlijk Sanctum-token terug voor de desktop tracker
     * wanneer de credentials kloppen.
     *
     * Bewust géén `Auth::attempt()` — dat zou een sessiecookie aanmaken op een
     * token-only endpoint. We checken het wachtwoord handmatig en geven enkel
     * de token terug.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $user = User::query()->where('email', $credentials['email'])->first();

        if ($user === null || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json(
                ['message' => 'Ongeldige inloggegevens.'],
                Response::HTTP_UNAUTHORIZED,
            );
        }

        $user->tokens()->where('name', self::TOKEN_NAME)->delete();
        $token = $user->createToken(self::TOKEN_NAME)->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'user' => [
                'id' => $user->id,
            ],
        ]);
    }
}
