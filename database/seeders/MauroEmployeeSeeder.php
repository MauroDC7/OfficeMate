<?php

namespace Database\Seeders;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MauroEmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $organizationId = 2;
        $joined = CarbonImmutable::parse('2025-09-01 08:00:00');

        $user = User::where('email', 'mauro@employee.com')->firstOrFail();

        $user->forceFill([
            'organization_id' => $organizationId,
            'organization_joined_at' => $joined,
            'employment_setup_completed_at' => $joined,
        ])->save();

        // Squad A (Backend) en Squad C (Frontend): brede ervaring over backend en frontend projecten heen
        $teamIds = DB::table('teams')
            ->where('organization_id', $organizationId)
            ->whereIn('name', ['Squad A', 'Squad C'])
            ->pluck('id');

        foreach ($teamIds as $teamId) {
            DB::table('team_memberships')->updateOrInsert(
                ['team_id' => $teamId, 'user_id' => $user->id],
                ['status' => 'approved', 'created_at' => $joined, 'updated_at' => $joined],
            );
        }

        // Alleen projecten die effectief aan Squad A of Squad C gekoppeld zijn
        $projectIds = DB::table('projects')
            ->where('organization_id', $organizationId)
            ->whereIn('name', ['Webshop Renovatie', 'Corporate Website Herontwerp', 'API Platform v2', 'TechFlow Website'])
            ->pluck('id', 'name');

        $now = now();

        $entries = [
            // Maandag 1 juni - Webshop Renovatie (Squad A)
            ['date' => '2026-06-01', 'project' => 'Webshop Renovatie', 'title' => 'Backend endpoints checkout-flow', 'start' => 9 * 60, 'end' => 12 * 60, 'color' => '#3b82f6'],
            ['date' => '2026-06-01', 'project' => 'Webshop Renovatie', 'title' => 'Code review Squad A', 'start' => 13 * 60, 'end' => 15 * 60, 'color' => '#3b82f6'],

            // Dinsdag 2 juni - Corporate Website Herontwerp (Squad C)
            ['date' => '2026-06-02', 'project' => 'Corporate Website Herontwerp', 'title' => 'Component library uitbreiden', 'start' => 9 * 60, 'end' => 11 * 60 + 30, 'color' => '#10b981'],
            ['date' => '2026-06-02', 'project' => 'Corporate Website Herontwerp', 'title' => 'Stand-up Squad C en styling homepage', 'start' => 13 * 60, 'end' => 16 * 60, 'color' => '#10b981'],

            // Woensdag 3 juni - API Platform v2 (Squad A)
            ['date' => '2026-06-03', 'project' => 'API Platform v2', 'title' => 'Database migraties schrijven', 'start' => 9 * 60, 'end' => 12 * 60, 'color' => '#8b5cf6'],
            ['date' => '2026-06-03', 'project' => 'API Platform v2', 'title' => 'Unit tests API endpoints', 'start' => 13 * 60 + 30, 'end' => 16 * 60, 'color' => '#8b5cf6'],

            // Donderdag 4 juni - TechFlow Website (gedeeld project van Squad A en Squad C)
            ['date' => '2026-06-04', 'project' => 'TechFlow Website', 'title' => 'Performance optimalisatie homepage', 'start' => 9 * 60, 'end' => 11 * 60, 'color' => '#f59e0b'],
            ['date' => '2026-06-04', 'project' => 'TechFlow Website', 'title' => 'Bugfixes navigatie en footer', 'start' => 13 * 60, 'end' => 15 * 60 + 30, 'color' => '#f59e0b'],

            // Vrijdag 5 juni - klantcontact en designreview
            ['date' => '2026-06-05', 'project' => 'Webshop Renovatie', 'title' => 'Klantoverleg Webshop Renovatie', 'start' => 9 * 60, 'end' => 11 * 60, 'color' => '#3b82f6'],
            ['date' => '2026-06-05', 'project' => 'Corporate Website Herontwerp', 'title' => 'Review designvoorstellen met UX-team', 'start' => 13 * 60, 'end' => 15 * 60, 'color' => '#10b981'],

            // Zaterdag 6 juni - korte sessie documentatie
            ['date' => '2026-06-06', 'project' => 'TechFlow Website', 'title' => 'Documentatie bijwerken', 'start' => 10 * 60, 'end' => 12 * 60, 'color' => '#f59e0b'],
        ];

        $rows = array_map(fn (array $entry) => [
            'user_id' => $user->id,
            'project_id' => $projectIds[$entry['project']],
            'worked_on' => $entry['date'],
            'title' => $entry['title'],
            'description' => null,
            'color' => $entry['color'],
            'start_minutes' => $entry['start'],
            'end_minutes' => $entry['end'],
            'created_at' => $now,
            'updated_at' => $now,
        ], $entries);

        DB::table('timesheet_entries')->insert($rows);

        $this->command->info('Mauro (employee) gekoppeld aan Techflow, in '.count($teamIds).' teams en '.count($rows).' timesheet-entries toegevoegd.');
    }
}
