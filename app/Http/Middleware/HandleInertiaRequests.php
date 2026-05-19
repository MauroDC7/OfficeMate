<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'isAdmin' => $request->user() instanceof User
                    && $request->user()->role === UserRole::Admin,
            ],
            'flash' => [
                'authError' => fn () => $request->session()->get('authError'),
                'status' => fn () => $request->session()->get('status'),
                'proposalsStatus' => fn () => $request->session()->get('proposalsStatus'),
                'proposalsMessage' => fn () => $request->session()->get('proposalsMessage'),
            ],
        ];
    }
}
