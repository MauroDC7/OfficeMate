<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateOrganizationRequest;
use App\Models\Organization;
use Illuminate\Http\RedirectResponse;

final class OrganizationSettingsController extends Controller
{
    public function __invoke(UpdateOrganizationRequest $request, Organization $organization): RedirectResponse
    {
        $organization->update([
            'name' => $request->validated('name'),
        ]);

        return redirect()->route('settings');
    }
}
