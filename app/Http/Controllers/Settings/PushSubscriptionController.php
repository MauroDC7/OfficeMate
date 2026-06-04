<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StorePushSubscriptionRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class PushSubscriptionController extends Controller
{
    public function store(StorePushSubscriptionRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->updatePushSubscription(
            $validated['endpoint'],
            $validated['keys']['p256dh'],
            $validated['keys']['auth'],
        );

        return redirect()
            ->route('settings')
            ->withFragment('push')
            ->with('status', 'Pushmeldingen ingeschakeld op dit apparaat.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();
        $endpoint = $request->string('endpoint')->toString();

        if ($endpoint !== '') {
            $user->deletePushSubscription($endpoint);
        } else {
            $user->pushSubscriptions()->delete();
        }

        return redirect()
            ->route('settings')
            ->withFragment('push')
            ->with('status', 'Pushmeldingen uitgeschakeld op dit apparaat.');
    }
}
