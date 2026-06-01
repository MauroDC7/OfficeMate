<?php

namespace App\Services\Timy;

use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\User;
use App\Models\WeeklyStatusUpdate;
use App\Services\AdminDashboardStats;
use App\Services\EmployeeDashboardStats;
use App\Services\WeeklyDebriefSchedule;
use Carbon\CarbonImmutable;

/**
 * @phpstan-type TimyActionLink array{label: string, href: string}
 * @phpstan-type TimyContext array{
 *     user: array{name: string, role: string, first_name: string},
 *     page: string,
 *     organization: bool,
 *     employee: ?array<string, mixed>,
 *     admin: ?array<string, mixed>,
 *     weekly_debrief: ?array<string, mixed>,
 *     tips: list<string>,
 *     quick_links: list<TimyActionLink>,
 * }
 */
final class TimyUserContext
{
    public function __construct(
        private readonly EmployeeDashboardStats $employeeDashboardStats,
        private readonly AdminDashboardStats $adminDashboardStats,
        private readonly WeeklyDebriefSchedule $weeklyDebriefSchedule,
    ) {}

    /**
     * @return TimyContext
     */
    public function build(User $user, string $pagePath): array
    {
        $page = $this->resolvePage($pagePath);
        $firstName = trim($user->first_name) !== '' ? trim($user->first_name) : $user->name;

        $context = [
            'user' => [
                'name' => $user->name,
                'first_name' => $firstName,
                'role' => $user->role->value,
            ],
            'page' => $page,
            'organization' => $user->organization_id !== null,
            'employee' => null,
            'admin' => null,
            'weekly_debrief' => $this->weeklyDebriefContext($user),
            'tips' => [],
            'quick_links' => $this->quickLinksForPage($page, $user->role === UserRole::Admin),
        ];

        if ($user->organization_id !== null) {
            if ($user->role === UserRole::Admin) {
                $organization = Organization::query()->find($user->organization_id);
                if ($organization !== null) {
                    $context['admin'] = $this->adminDashboardStats->forOrganization($organization);
                }
            } else {
                $context['employee'] = $this->employeeDashboardStats->forUser($user);
            }
        }

        $context['tips'] = $this->proactiveTips($user, $context);

        return $context;
    }

    private function resolvePage(string $pagePath): string
    {
        $path = trim(parse_url($pagePath, PHP_URL_PATH) ?? $pagePath, '/') ?: 'dashboard';

        return match (true) {
            $path === '' || $path === 'dashboard' => 'dashboard',
            str_starts_with($path, 'timesheets') => 'timesheets',
            str_starts_with($path, 'projects') => 'projects',
            str_starts_with($path, 'leave-requests') => 'leave_requests',
            str_starts_with($path, 'admin/leave-requests') => 'admin_leave',
            str_starts_with($path, 'admin/weekly-debrief') => 'admin_weekly_debrief',
            str_starts_with($path, 'teams') => 'teams',
            str_starts_with($path, 'settings') => 'settings',
            default => 'other',
        };
    }

    /**
     * @return list<TimyActionLink>
     */
    private function quickLinksForPage(string $page, bool $isAdmin): array
    {
        $links = [
            ['label' => 'Dashboard', 'href' => route('dashboard')],
            ['label' => 'Timesheets', 'href' => route('timesheets')],
            ['label' => 'Projecten', 'href' => route('projects')],
            ['label' => 'Verlof', 'href' => route($isAdmin ? 'admin.leaveRequests' : 'leaveRequests')],
            ['label' => 'Instellingen', 'href' => route('settings')],
        ];

        if ($isAdmin) {
            $links[] = ['label' => 'Weekly debrief', 'href' => route('admin.weeklyDebrief')];
            $links[] = ['label' => 'Teams', 'href' => route('teams')];
        }

        return match ($page) {
            'timesheets' => [
                ['label' => 'Timesheets openen', 'href' => route('timesheets')],
                ['label' => 'Projecten', 'href' => route('projects')],
            ],
            'projects' => [
                ['label' => 'Projecten', 'href' => route('projects')],
                ['label' => 'Timesheets', 'href' => route('timesheets')],
            ],
            'leave_requests', 'admin_leave' => [
                ['label' => 'Verlofbeheer', 'href' => route($isAdmin ? 'admin.leaveRequests' : 'leaveRequests')],
            ],
            'admin_weekly_debrief' => [
                ['label' => 'Weekly debrief', 'href' => route('admin.weeklyDebrief')],
            ],
            default => array_slice($links, 0, 4),
        };
    }

    /**
     * @return array{week_start: string, filled: bool, reminder_due: bool}|null
     */
    private function weeklyDebriefContext(User $user): ?array
    {
        if ($user->organization_id === null || $user->role === UserRole::Admin) {
            return null;
        }

        $now = CarbonImmutable::now($this->weeklyDebriefSchedule->timezone());
        $monday = $now->startOfWeek(CarbonImmutable::MONDAY);

        $row = WeeklyStatusUpdate::query()
            ->where('user_id', $user->id)
            ->whereDate('week_start', $monday->toDateString())
            ->first();

        return [
            'week_start' => $monday->toDateString(),
            'filled' => $row !== null
                && trim((string) $row->difficult_this_week) !== ''
                && trim((string) $row->plans_next_week) !== '',
            'reminder_due' => $this->weeklyDebriefSchedule->isReminderDue($now) && $row === null,
        ];
    }

    /**
     * @param  TimyContext  $context
     * @return list<string>
     */
    private function proactiveTips(User $user, array $context): array
    {
        $tips = [];

        if ($user->organization_id === null) {
            $tips[] = 'Je bent nog niet gekoppeld aan een organisatie. Rond je instellingen af om TimeTraq volledig te gebruiken.';

            return $tips;
        }

        $employee = $context['employee'];
        if (is_array($employee)) {
            if (($employee['hoursThisWeekMinutes'] ?? 0) === 0) {
                $tips[] = 'Je hebt deze week nog geen uren geboekt.';
            }

            if (($employee['pendingTimesheetCount'] ?? 0) > 0) {
                $tips[] = 'Er staan timesheet-voorstellen klaar om te beoordelen.';
            }

            if (($employee['pendingLeaveRequestCount'] ?? 0) > 0) {
                $tips[] = 'Je hebt een verlofaanvraag die nog in behandeling is.';
            }
        }

        $weekly = $context['weekly_debrief'];
        if (is_array($weekly) && ($weekly['reminder_due'] ?? false) === true) {
            $tips[] = 'Je weekly debrief voor deze week is nog niet ingevuld.';
        }

        $admin = $context['admin'];
        if (is_array($admin)) {
            if (($admin['pendingLeaveRequestCount'] ?? 0) > 0) {
                $tips[] = 'Er wachten verlofaanvragen op goedkeuring.';
            }

            if (($admin['pendingMembershipCount'] ?? 0) > 0) {
                $tips[] = 'Er zijn teamaanvragen die je kunt goedkeuren.';
            }
        }

        return $tips;
    }

    public static function formatMinutes(int $minutes): string
    {
        $hours = intdiv($minutes, 60);
        $rest = $minutes % 60;

        if ($hours === 0) {
            return "{$rest} min";
        }

        if ($rest === 0) {
            return "{$hours} u";
        }

        return "{$hours} u {$rest} min";
    }
}
