<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class DesktopAuthController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', $credentials['email'])->first();

        if ($user === null || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'De combinatie van e-mailadres en wachtwoord is niet juist.',
            ], 401);
        }

        $token = $user->createToken('office-mate-tracker')->plainTextToken;

        return response()->json([
            'token' => $token,
            'access_token' => $token,
            'user_id' => $user->id,
            'user' => [
                'id' => $user->id,
            ],
            'data' => [
                'token' => $token,
            ],
        ]);
    }
}
