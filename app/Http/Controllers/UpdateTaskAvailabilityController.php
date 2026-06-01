<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateTaskAvailabilityRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

final class UpdateTaskAvailabilityController extends Controller
{
    public function __invoke(UpdateTaskAvailabilityRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $user->update($request->validated());

        return redirect()
            ->route('projects')
            ->with('status', 'Taakstatus bijgewerkt.');
    }
}
