<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateOrganizationOfficeIpsRequest;
use App\Models\User;
use App\Services\OrganizationContext;
use Illuminate\Http\RedirectResponse;

final class OrganizationOfficeIpsController extends Controller
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
    ) {}

    public function __invoke(UpdateOrganizationOfficeIpsRequest $request): RedirectResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($admin);

        $addresses = collect($request->validated('office_ip_addresses'))
            ->map(fn (mixed $address): string => trim((string) $address))
            ->filter(fn (string $address): bool => $address !== '')
            ->values()
            ->all();

        $organization->update([
            'office_ip_addresses' => $addresses === [] ? null : $addresses,
        ]);

        return redirect()->route('settings');
    }
}
