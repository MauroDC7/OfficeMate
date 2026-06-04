<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Models\User;
use App\Services\RecentInAppNotifications;
use Illuminate\Http\Request;
use Inertia\Inertia;
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
            'webPush' => function () use ($request): ?array {
                $publicKey = config('webpush.vapid.public_key');
                $user = $request->user();

                if (! is_string($publicKey) || $publicKey === '' || ! $user instanceof User) {
                    return null;
                }

                return [
                    'publicKey' => $publicKey,
                    'subscribed' => $user->pushSubscriptions()->exists(),
                ];
            },
            'broadcasting' => function () use ($request): ?array {
                if (! $request->user() instanceof User) {
                    return null;
                }

                if (config('broadcasting.default') !== 'pusher') {
                    return null;
                }

                $key = config('broadcasting.connections.pusher.key');
                $cluster = config('broadcasting.connections.pusher.options.cluster');

                if (! is_string($key) || $key === '' || ! is_string($cluster) || $cluster === '') {
                    return null;
                }

                return [
                    'key' => $key,
                    'cluster' => $cluster,
                ];
            },
            'recentNotifications' => Inertia::always(function () use ($request): array {
                $user = $request->user();

                if (! $user instanceof User) {
                    return [];
                }

                return app(RecentInAppNotifications::class)->forUser($user);
            }),
        ];
    }
}
