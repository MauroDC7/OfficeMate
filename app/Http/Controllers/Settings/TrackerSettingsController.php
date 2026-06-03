<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateTrackerSettingsRequest;
use Illuminate\Http\RedirectResponse;

final class TrackerSettingsController extends Controller
{
    public function __invoke(UpdateTrackerSettingsRequest $request): RedirectResponse
    {
        $user = $request->user();
        $user->fill($request->trackerPreferences());
        $user->save();

        return redirect()->route('settings')->withFragment('tracker');
    }
}
