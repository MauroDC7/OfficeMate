<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Project;
use App\Models\TimesheetEntry;
use App\Models\TimesheetEntryProposal;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class EmployeeUserThreeTestDataSeeder extends Seeder
{
    public function run(): void
    {
        $timezone = config('services.timesheets.timezone', 'Europe/Brussels');
        $weekStart = CarbonImmutable::now($timezone)->startOfWeek(CarbonImmutable::MONDAY);
        $workedOn = fn (int $dayOffset): string => $weekStart->addDays($dayOffset)->toDateString();
        $lastWeekStart = $weekStart->subWeek();

        foreach (
            [
                ['name' => 'OfficeMate platform', 'client_name' => 'OfficeMate', 'is_active' => true],
                ['name' => 'Klantenportaal redesign', 'client_name' => 'Acme BV', 'is_active' => true],
                ['name' => 'API-integratie facturatie', 'client_name' => 'Northwind', 'is_active' => true],
                ['name' => 'Intern onderhoud 2025', 'client_name' => null, 'is_active' => false],
            ] as $project
        ) {
            Project::query()->updateOrCreate(
                ['name' => $project['name']],
                $project,
            );
        }

        $users = $this->resolveUsers();

        if ($users->isEmpty()) {
            throw new \RuntimeException(
                'Geen medewerker gevonden met id 3 of e-mail mauro@employee.be.',
            );
        }

        foreach ($users as $user) {
            $this->seedTimesheetsForUser($user, $workedOn, $lastWeekStart);
        }
    }

    /**
     * @return Collection<int, User>
     */
    private function resolveUsers(): Collection
    {
        return User::query()
            ->where('role', UserRole::Employee)
            ->where(function ($query): void {
                $query->whereKey(3)
                    ->orWhere('email', 'mauro@employee.be');
            })
            ->orderBy('id')
            ->get()
            ->unique('id')
            ->values();
    }

    private function seedTimesheetsForUser(
        User $user,
        callable $workedOn,
        CarbonImmutable $lastWeekStart,
    ): void {
        TimesheetEntry::query()->where('user_id', $user->id)->delete();
        TimesheetEntryProposal::query()->where('user_id', $user->id)->delete();

        $entries = [
            [
                'worked_on' => $workedOn(0),
                'title' => 'Sprintplanning OfficeMate',
                'description' => 'Backlog doorgenomen en tickets klaargezet.',
                'client_name' => 'OfficeMate',
                'start_minutes' => 9 * 60,
                'end_minutes' => 11 * 60 + 30,
            ],
            [
                'worked_on' => $workedOn(1),
                'title' => 'Timesheet dashboard',
                'description' => 'Medewerkersdashboard opgezet met statistieken.',
                'client_name' => 'OfficeMate',
                'start_minutes' => 13 * 60 + 30,
                'end_minutes' => 17 * 60,
            ],
            [
                'worked_on' => $workedOn(1),
                'title' => 'Tijdregistratie en statuscontrole',
                'description' => 'Tracker gecontroleerd en timesheets bijgewerkt.',
                'client_name' => 'OfficeMate',
                'start_minutes' => 9 * 60,
                'end_minutes' => 10 * 60 + 30,
            ],
            [
                'worked_on' => $workedOn(2),
                'title' => 'Klantenportaal wireframes',
                'description' => 'Review met design en feedback verwerkt.',
                'client_name' => 'Acme BV',
                'start_minutes' => 10 * 60,
                'end_minutes' => 12 * 60 + 15,
            ],
            [
                'worked_on' => $workedOn(3),
                'title' => 'API-documentatie',
                'description' => 'Endpoints voor facturatie-koppeling beschreven.',
                'client_name' => 'Northwind',
                'start_minutes' => 14 * 60,
                'end_minutes' => 16 * 60 + 45,
            ],
            [
                'worked_on' => $workedOn(4),
                'title' => 'Implementatie dashboard widgets',
                'description' => 'Statistiekkaarten en notificatieblok afgerond.',
                'client_name' => 'OfficeMate',
                'start_minutes' => 13 * 60,
                'end_minutes' => 17 * 60 + 15,
            ],
            [
                'worked_on' => $lastWeekStart->addDays(1)->toDateString(),
                'title' => 'Refactoring timesheet module',
                'description' => 'Kalenderweergave en validatie opgeschoond.',
                'client_name' => 'OfficeMate',
                'start_minutes' => 9 * 60 + 30,
                'end_minutes' => 12 * 60,
            ],
            [
                'worked_on' => $lastWeekStart->addDays(3)->toDateString(),
                'title' => 'Klantdemo Acme',
                'description' => 'Walkthrough van het nieuwe portaal.',
                'client_name' => 'Acme BV',
                'start_minutes' => 14 * 60,
                'end_minutes' => 15 * 60 + 30,
            ],
        ];

        foreach ($entries as $entry) {
            TimesheetEntry::query()->create([
                'user_id' => $user->id,
                ...$entry,
            ]);
        }

        $proposals = [
            [
                'worked_on' => $workedOn(4),
                'title' => 'Code review en fixes',
                'description' => 'Pull requests nagekeken en kleine bugs opgelost.',
                'client_name' => 'OfficeMate',
                'start_minutes' => 9 * 60 + 15,
                'end_minutes' => 11 * 60,
                'source' => 'activitywatch',
            ],
            [
                'worked_on' => $workedOn(4),
                'title' => 'Supportmails klant',
                'description' => 'Vragen over login en timesheets beantwoord.',
                'client_name' => 'Acme BV',
                'start_minutes' => 11 * 60 + 30,
                'end_minutes' => 12 * 60 + 30,
                'source' => 'activitywatch',
            ],
            [
                'worked_on' => $workedOn(2),
                'title' => 'Voorbereiding klantcall',
                'description' => 'Agenda en notities doorgenomen.',
                'client_name' => 'Northwind',
                'start_minutes' => 15 * 60 + 45,
                'end_minutes' => 16 * 60 + 30,
                'source' => 'activitywatch',
            ],
        ];

        foreach ($proposals as $proposal) {
            TimesheetEntryProposal::query()->create([
                'user_id' => $user->id,
                ...$proposal,
            ]);
        }
    }
}
