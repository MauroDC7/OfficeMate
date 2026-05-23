<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAccountInformationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

final class AccountSettingsController extends Controller
{
    public function __invoke(UpdateAccountInformationRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if ($request->hasFile('avatar')) {
            $this->deleteStoredAvatar($user->avatar_path);
            $user->avatar_path = $request->file('avatar')->store('avatars', 'public');
        } elseif ($request->boolean('remove_avatar')) {
            $this->deleteStoredAvatar($user->avatar_path);
            $user->avatar_path = null;
        }

        $user->fill(Arr::only($validated, ['username']));
        $user->save();

        return redirect()->route('settings');
    }

    private function deleteStoredAvatar(?string $path): void
    {
        if ($path === null || $path === '') {
            return;
        }

        Storage::disk('public')->delete($path);
    }
}
