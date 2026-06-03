<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OrganizationContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class EmployeeEmploymentSearchController extends Controller
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($admin);
        $query = trim((string) $request->query('q', ''));

        if (mb_strlen($query) < 2) {
            return response()->json(['results' => []]);
        }

        $like = '%'.$query.'%';

        $results = User::query()
            ->where('organization_id', $organization->id)
            ->where(function ($builder) use ($like): void {
                $builder
                    ->where('email', 'like', $like)
                    ->orWhere('first_name', 'like', $like)
                    ->orWhere('last_name', 'like', $like);
            })
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->limit(8)
            ->get([
                'id',
                'first_name',
                'last_name',
                'email',
                'avatar_path',
                'weekly_work_hours',
                'annual_leave_days',
                'employment_profile_id',
            ])
            ->map(fn (User $employee): array => [
                'id' => $employee->id,
                'first_name' => $employee->first_name,
                'last_name' => $employee->last_name,
                'email' => $employee->email,
                'avatar' => $employee->avatar,
                'weekly_work_hours' => (int) $employee->weekly_work_hours,
                'annual_leave_days' => (int) $employee->annual_leave_days,
                'employment_profile_id' => $employee->employment_profile_id,
            ])
            ->all();

        return response()->json(['results' => $results]);
    }
}
