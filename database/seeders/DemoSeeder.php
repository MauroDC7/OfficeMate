<?php

namespace Database\Seeders;

use App\Enums\LeaveRequestStatus;
use App\Enums\LeaveType;
use App\Enums\ProjectStatus;
use App\Enums\ProjectType;
use App\Enums\TaskAvailability;
use App\Enums\TeamMembershipStatus;
use App\Enums\UserRole;
use App\Models\EmploymentProfile;
use App\Models\Organization;
use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\WeeklyStatusUpdate;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $isMysql = DB::getDriverName() === 'mysql';

        if ($isMysql) {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        } else {
            DB::statement('PRAGMA foreign_keys=OFF;');
        }

        $this->truncate();

        if ($isMysql) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        } else {
            DB::statement('PRAGMA foreign_keys=ON;');
        }

        $org      = $this->organization();
        $profiles = $this->employmentProfiles($org);
        $users    = $this->users($org, $profiles);
        $teams    = $this->teams($org);
        $this->teamMemberships($users, $teams);
        $projects = $this->projects($org, $users['mauro']);
        $this->projectTeams($projects, $teams);
        $this->timesheetEntries($users, $projects);
        $this->timesheetProposals($users, $projects);
        $this->leaveRequests($users);
        $this->weeklyStatusUpdates($users);
        $this->weeklyDebriefSummary($org);
        $this->notifications($users);
        $this->timyConversations($users);
        $this->desktopActivities($users['mauro']);
        $this->organizationInvite($org, $users['mauro']);

        $this->command->info('TechFlow Digital demo data aangemaakt.');
        $this->command->table(
            ['Email', 'Naam', 'Rol', 'Wachtwoord'],
            array_map(
                fn(User $u) => [$u->email, $u->first_name.' '.$u->last_name, $u->role->value, 'password'],
                array_values($users),
            ),
        );
    }

    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------

    private function truncate(): void
    {
        foreach ([
            'timy_messages', 'timy_conversations',
            'weekly_debrief_summaries', 'weekly_status_updates',
            'desktop_activities',
            'timesheet_entry_proposals', 'timesheet_entries',
            'leave_request_attachments', 'leave_requests',
            'project_team', 'team_memberships',
            'projects', 'teams',
            'notifications', 'organization_invites',
            'personal_access_tokens', 'push_subscriptions',
            'sessions',
            'users', 'employment_profiles', 'organizations',
            'cache', 'cache_locks',
        ] as $table) {
            DB::table($table)->truncate();
        }
    }

    // -------------------------------------------------------------------------
    // Organization
    // -------------------------------------------------------------------------

    private function organization(): Organization
    {
        return Organization::create([
            'name'                       => 'TechFlow Digital',
            'default_weekly_work_hours'  => 40,
            'default_annual_leave_days'  => 25,
            'office_ip_addresses'        => ['127.0.0.1'],
        ]);
    }

    // -------------------------------------------------------------------------
    // Employment profiles
    // -------------------------------------------------------------------------

    /** @return array<string, EmploymentProfile> */
    private function employmentProfiles(Organization $org): array
    {
        $make = fn(string $name, int $hours, int $days) => EmploymentProfile::create([
            'organization_id'  => $org->id,
            'name'             => $name,
            'weekly_work_hours' => $hours,
            'annual_leave_days' => $days,
        ]);

        return [
            'voltijds'  => $make('Voltijds', 40, 25),
            'deeltijds' => $make('Deeltijds', 32, 20),
            'senior'    => $make('Senior', 40, 30),
        ];
    }

    // -------------------------------------------------------------------------
    // Users
    // -------------------------------------------------------------------------

    /** @return array<string, User> */
    private function users(Organization $org, array $profiles): array
    {
        $pw      = Hash::make('password');
        $joined  = CarbonImmutable::parse('2025-09-01 08:00:00');
        $inOffice = CarbonImmutable::parse('2026-06-05 08:45:00');

        $make = fn(array $fields) => User::create(array_merge([
            'password'                   => $pw,
            'email_verified_at'          => $joined,
            'privacy_policy_accepted_at' => $joined,
            'organization_id'            => $org->id,
            'organization_joined_at'     => $joined,
            'last_seen_at_office'        => $inOffice,
            'tracker_use_ai_for_proposals' => true,
            'tracker_tracking_enabled'   => true,
        ], $fields));

        return [
            'mauro' => $make([
                'first_name'                    => 'Mauro',
                'last_name'                     => 'De Cleen',
                'email'                         => 'mauro@techflow.be',
                'role'                          => UserRole::Admin,
                'can_create_projects'           => true,
                'employment_profile_id'         => $profiles['senior']->id,
                'weekly_work_hours'             => 40,
                'annual_leave_days'             => 30,
                'task_availability'             => TaskAvailability::OnTask,
                'employment_setup_completed_at' => $joined,
            ]),
            'lars' => $make([
                'first_name'                    => 'Lars',
                'last_name'                     => 'Janssen',
                'email'                         => 'lars@techflow.be',
                'role'                          => UserRole::Employee,
                'employment_profile_id'         => $profiles['voltijds']->id,
                'weekly_work_hours'             => 40,
                'annual_leave_days'             => 25,
                'task_availability'             => TaskAvailability::OpenForTasks,
                'employment_setup_completed_at' => $joined,
            ]),
            'emma' => $make([
                'first_name'                    => 'Emma',
                'last_name'                     => 'Peeters',
                'email'                         => 'emma@techflow.be',
                'role'                          => UserRole::Employee,
                'employment_profile_id'         => $profiles['voltijds']->id,
                'weekly_work_hours'             => 40,
                'annual_leave_days'             => 25,
                'task_availability'             => TaskAvailability::OnTask,
                'employment_setup_completed_at' => $joined,
            ]),
            'nathalie' => $make([
                'first_name'                    => 'Nathalie',
                'last_name'                     => 'Dubois',
                'email'                         => 'nathalie@techflow.be',
                'role'                          => UserRole::Employee,
                'employment_profile_id'         => $profiles['deeltijds']->id,
                'weekly_work_hours'             => 32,
                'annual_leave_days'             => 20,
                'task_availability'             => TaskAvailability::OpenForTasks,
                'employment_setup_completed_at' => $joined,
            ]),
            'thomas' => $make([
                'first_name'                    => 'Thomas',
                'last_name'                     => 'Van Berg',
                'email'                         => 'thomas@techflow.be',
                'role'                          => UserRole::Employee,
                'employment_profile_id'         => $profiles['voltijds']->id,
                'weekly_work_hours'             => 40,
                'annual_leave_days'             => 25,
                'task_availability'             => TaskAvailability::OpenForTasks,
                'employment_setup_completed_at' => $joined,
            ]),
            'charlotte' => $make([
                'first_name'                    => 'Charlotte',
                'last_name'                     => 'Willems',
                'email'                         => 'charlotte@techflow.be',
                'role'                          => UserRole::Employee,
                'employment_profile_id'         => $profiles['senior']->id,
                'weekly_work_hours'             => 40,
                'annual_leave_days'             => 30,
                'task_availability'             => TaskAvailability::OnTask,
                'employment_setup_completed_at' => $joined,
            ]),
            'jens' => $make([
                'first_name'                    => 'Jens',
                'last_name'                     => 'Claes',
                'email'                         => 'jens@techflow.be',
                'role'                          => UserRole::Employee,
                'employment_profile_id'         => $profiles['voltijds']->id,
                'weekly_work_hours'             => 40,
                'annual_leave_days'             => 25,
                'task_availability'             => TaskAvailability::OpenForTasks,
                'organization_joined_at'        => CarbonImmutable::parse('2026-04-01 08:00:00'),
                'employment_setup_completed_at' => null, // zichtbaar in admin-inbox
            ]),
        ];
    }

    // -------------------------------------------------------------------------
    // Teams
    // -------------------------------------------------------------------------

    /** @return array<string, Team> */
    private function teams(Organization $org): array
    {
        $make = fn(string $name, string $dept) => Team::create([
            'organization_id' => $org->id,
            'name'            => $name,
            'department'      => $dept,
        ]);

        return [
            'frontend'   => $make('Frontend Development', 'Development'),
            'backend'    => $make('Backend Development', 'Development'),
            'design'     => $make('UX & Design', 'Design'),
            'marketing'  => $make('Digital Marketing', 'Marketing'),
            'management' => $make('Project Management', 'Management'),
        ];
    }

    private function teamMemberships(array $users, array $teams): void
    {
        $a = TeamMembershipStatus::Approved;
        $p = TeamMembershipStatus::Pending;

        foreach ([
            [$users['mauro'],    $teams['management'], $a],
            [$users['mauro'],    $teams['frontend'],   $a],
            [$users['lars'],     $teams['frontend'],   $a],
            [$users['charlotte'],$teams['frontend'],   $a],
            [$users['charlotte'],$teams['backend'],    $a],
            [$users['jens'],     $teams['frontend'],   $a],
            [$users['emma'],     $teams['backend'],    $a],
            [$users['nathalie'], $teams['design'],     $a],
            [$users['thomas'],   $teams['marketing'],  $a],
            [$users['jens'],     $teams['backend'],    $p], // open lidmaatschapsaanvraag
        ] as [$user, $team, $status]) {
            TeamMembership::create([
                'team_id' => $team->id,
                'user_id' => $user->id,
                'status'  => $status,
            ]);
        }
    }

    // -------------------------------------------------------------------------
    // Projects
    // -------------------------------------------------------------------------

    /** @return array<string, Project> */
    private function projects(Organization $org, User $creator): array
    {
        $make = fn(array $fields) => Project::create(array_merge([
            'organization_id' => $org->id,
            'created_by'      => $creator->id,
            'is_active'       => true,
        ], $fields));

        return [
            'webshop'   => $make([
                'name'         => 'Webshop Renovatie',
                'type'         => ProjectType::External,
                'status'       => ProjectStatus::InProgress,
                'client_name'  => 'Maes Retail NV',
                'hours_budget' => 200,
            ]),
            'corporate' => $make([
                'name'         => 'Corporate Website Herontwerp',
                'type'         => ProjectType::External,
                'status'       => ProjectStatus::InProgress,
                'client_name'  => 'Van den Berg & Partners',
                'hours_budget' => 160,
            ]),
            'api'       => $make([
                'name'         => 'API Platform v2',
                'type'         => ProjectType::External,
                'status'       => ProjectStatus::InProgress,
                'client_name'  => 'Nexus Logistics',
                'hours_budget' => 300,
            ]),
            'seo'       => $make([
                'name'         => 'SEO & Google Ads',
                'type'         => ProjectType::External,
                'status'       => ProjectStatus::WaitingForClient,
                'client_name'  => 'Bloemenwinkel Sofie',
                'hours_budget' => 80,
            ]),
            'branding'  => $make([
                'name'         => 'Branding & Huisstijl',
                'type'         => ProjectType::External,
                'status'       => ProjectStatus::Done,
                'client_name'  => 'Startup Hub Gent',
                'hours_budget' => 120,
                'is_active'    => false,
            ]),
            'stagiairs' => $make([
                'name'         => 'Stagiairs Leerlijn',
                'type'         => ProjectType::Internal,
                'status'       => ProjectStatus::InProgress,
                'client_name'  => null,
                'hours_budget' => null,
            ]),
            'website'   => $make([
                'name'         => 'TechFlow Website',
                'type'         => ProjectType::Internal,
                'status'       => ProjectStatus::InProgress,
                'client_name'  => null,
                'hours_budget' => 100,
            ]),
        ];
    }

    private function projectTeams(array $projects, array $teams): void
    {
        foreach ([
            [$projects['webshop'],   [$teams['frontend'], $teams['design']]],
            [$projects['corporate'], [$teams['frontend'], $teams['design']]],
            [$projects['api'],       [$teams['backend']]],
            [$projects['seo'],       [$teams['marketing']]],
            [$projects['branding'],  [$teams['design']]],
            [$projects['stagiairs'], [$teams['frontend']]],
            [$projects['website'],   [$teams['frontend'], $teams['backend'], $teams['design'], $teams['marketing'], $teams['management']]],
        ] as [$project, $linkedTeams]) {
            $project->teams()->attach(collect($linkedTeams)->pluck('id')->toArray());
        }
    }

    // -------------------------------------------------------------------------
    // Timesheets
    // -------------------------------------------------------------------------

    private function timesheetEntries(array $users, array $projects): void
    {
        // Vorige week: ma 25 mei – vr 29 mei 2026
        // Huidige week: ma 1 jun – vr 5 jun 2026
        $lastWeek = ['2026-05-25', '2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29'];
        $thisWeek = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05'];

        $h = fn(int $hours, int $min = 0): int => $hours * 60 + $min;

        $save = fn(User $user, string $date, int $start, int $end, string $title, string $desc, Project $project, string $color) =>
            $user->timesheetEntries()->create([
                'project_id'    => $project->id,
                'worked_on'     => $date,
                'start_minutes' => $start,
                'end_minutes'   => $end,
                'title'         => $title,
                'description'   => $desc,
                'color'         => $color,
            ]);

        // --- MAURO | Project Management | paars ---
        $mauro = $users['mauro'];
        $pattern = [
            0 => [[$h(9), $h(10,30), 'Sprintplanning', 'Backlog doorgenomen, sprint doelen bepaald met het team.', $projects['website'], '#8b5cf6'],
                  [$h(11), $h(12,30), 'Statusoverleg Maes Retail', 'Voortgang webshop renovatie besproken, risico\'s geïnventariseerd.', $projects['webshop'], '#8b5cf6'],
                  [$h(13,30), $h(17), 'Budgetopvolging Q2', 'Urenrapporten geanalyseerd, budgetafwijkingen gedocumenteerd.', $projects['api'], '#8b5cf6']],
            1 => [[$h(9), $h(10), 'Dagelijkse stand-up', 'Stand-up met frontend en backend teams.', $projects['website'], '#8b5cf6'],
                  [$h(10,30), $h(12,30), 'Stagiairsbegeleiding', 'Voortgangsgesprek met Jens, leerdoelen bijgesteld.', $projects['stagiairs'], '#8b5cf6'],
                  [$h(14), $h(17), 'Clientmeeting Van den Berg', 'Feedbackronde corporate website herontwerp doorgenomen.', $projects['corporate'], '#8b5cf6']],
            2 => [[$h(9,30), $h(11), 'Retrospective', 'Verbeterpunten vorige sprint verwerkt.', $projects['website'], '#8b5cf6'],
                  [$h(13), $h(15,30), 'Nexus Logistics afstemming', 'Deliverables API platform v2 geprioriteerd.', $projects['api'], '#8b5cf6'],
                  [$h(16), $h(17,30), 'Website strategie', 'Nieuwe pagina\'s en SEO-aanpak voor TechFlow website gepland.', $projects['website'], '#8b5cf6']],
            3 => [[$h(9), $h(10,30), 'Projectreviews', 'Status van alle actieve projecten doorgenomen.', $projects['webshop'], '#8b5cf6'],
                  [$h(11), $h(12,30), 'HR & teamplanning', 'Vakantiedagen en bezetting komende maand besproken.', $projects['website'], '#8b5cf6'],
                  [$h(14), $h(17), 'Urenrapport opstellen', 'Overzicht gefactureerde uren per klant voor mei gemaakt.', $projects['corporate'], '#8b5cf6']],
            4 => [[$h(9,30), $h(11), 'Weekoverzicht & prioriteiten', 'Taken volgende week ingepland, urgente items gemarkeerd.', $projects['website'], '#8b5cf6'],
                  [$h(13), $h(15), 'Demo voorbereiding Nexus', 'Presentatie voor API-deliverable klant voorbereid.', $projects['api'], '#8b5cf6'],
                  [$h(15,30), $h(17,30), 'Content review website', 'Portfoliopagina\'s en casestudies nagelezen.', $projects['website'], '#8b5cf6']],
        ];
        foreach (array_merge($lastWeek, $thisWeek) as $i => $date) {
            foreach ($pattern[$i % 5] as [$s, $e, $t, $d, $p, $c]) {
                $save($mauro, $date, $s, $e, $t, $d, $p, $c);
            }
        }

        // --- LARS | Frontend Development | blauw ---
        $lars = $users['lars'];
        $pattern = [
            0 => [[$h(9), $h(12), 'Homepage componenten webshop', 'Hero-sectie en productenraster gebouwd in React.', $projects['webshop'], '#3b82f6'],
                  [$h(13), $h(17), 'Navigatie & routing corporate site', 'Breadcrumbs en subnavigatie volledig geïmplementeerd.', $projects['corporate'], '#3b82f6']],
            1 => [[$h(9), $h(11,30), 'Responsive design webshop', 'Mobile breakpoints afgesteld, layout getest op iOS en Android.', $projects['webshop'], '#3b82f6'],
                  [$h(13,30), $h(16,30), 'Product filters & zoekfunctie', 'Dynamische productfilters gebouwd met realtime resultaten.', $projects['webshop'], '#3b82f6']],
            2 => [[$h(9,30), $h(12,30), 'Animaties corporate website', 'Scroll-animaties geïntegreerd met Framer Motion.', $projects['corporate'], '#3b82f6'],
                  [$h(14), $h(17,30), 'TechFlow website hero-sectie', 'Nieuwe hero-sectie ontworpen en als component gebouwd.', $projects['website'], '#3b82f6']],
            3 => [[$h(9), $h(11), 'Code review pull requests', 'PR\'s van Charlotte en Jens nagekeken en goedgekeurd.', $projects['webshop'], '#3b82f6'],
                  [$h(13), $h(17), 'Checkout flow webshop', 'Stap-voor-stap checkout gebouwd inclusief validatie en foutafhandeling.', $projects['webshop'], '#3b82f6']],
            4 => [[$h(9,30), $h(12), 'Performance optimalisatie', 'Lazy loading en image optimization geïmplementeerd, Lighthouse score +18.', $projects['corporate'], '#3b82f6'],
                  [$h(13,30), $h(16,30), 'Storybook component library', 'Stories geschreven voor alle herbruikbare UI-componenten.', $projects['website'], '#3b82f6']],
        ];
        foreach (array_merge($lastWeek, $thisWeek) as $i => $date) {
            foreach ($pattern[$i % 5] as [$s, $e, $t, $d, $p, $c]) {
                $save($lars, $date, $s, $e, $t, $d, $p, $c);
            }
        }

        // --- EMMA | Backend Development | groen ---
        $emma = $users['emma'];
        $pattern = [
            0 => [[$h(9), $h(12,30), 'REST API endpoints Nexus', 'CRUD-endpoints voor zendingen en leveranciers gebouwd en gedocumenteerd.', $projects['api'], '#10b981'],
                  [$h(13,30), $h(17), 'Database schema optimalisatie', 'Indexen toegevoegd, trage queries opgespoord en geoptimaliseerd.', $projects['api'], '#10b981']],
            1 => [[$h(9), $h(11), 'Authenticatie & JWT refresh flow', 'Token refresh geïmplementeerd en getest met integratietests.', $projects['api'], '#10b981'],
                  [$h(13), $h(16,30), 'Webhook integraties', 'Webhooks voor orderstatus-updates geschreven en gedebugd.', $projects['api'], '#10b981']],
            2 => [[$h(9,30), $h(12), 'OpenAPI documentatie', 'Swagger-definitie bijgewerkt voor alle nieuwe endpoints.', $projects['api'], '#10b981'],
                  [$h(14), $h(17,30), 'TechFlow website backend', 'Contactformulier-backend en e-mailnotificaties gebouwd.', $projects['website'], '#10b981']],
            3 => [[$h(9), $h(12), 'Unit & integratietests', 'Tests geschreven voor authenticatie, webhooks en edge cases.', $projects['api'], '#10b981'],
                  [$h(13,30), $h(17), 'CI/CD pipeline fixes', 'Buildfouten opgelost, automatische deployment naar staging hersteld.', $projects['website'], '#10b981']],
            4 => [[$h(9,30), $h(11,30), 'Interne code review API', 'Volledige API-codebase gereviewed met focus op veiligheid.', $projects['api'], '#10b981'],
                  [$h(13), $h(16), 'Rate limiting & beveiliging', 'API rate limits ingesteld, kwetsbaarheden geauditeerd.', $projects['api'], '#10b981']],
        ];
        foreach (array_merge($lastWeek, $thisWeek) as $i => $date) {
            foreach ($pattern[$i % 5] as [$s, $e, $t, $d, $p, $c]) {
                $save($emma, $date, $s, $e, $t, $d, $p, $c);
            }
        }

        // --- NATHALIE | UX & Design | roze | deeltijds ma-do ---
        $nathalie = $users['nathalie'];
        $lastWeekShort = ['2026-05-25', '2026-05-26', '2026-05-27', '2026-05-28'];
        $thisWeekShort = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04'];
        $pattern = [
            0 => [[$h(9), $h(12), 'Wireframes webshop homepage', 'Low-fidelity wireframes gemaakt in Figma en gedeeld met het team.', $projects['webshop'], '#ec4899'],
                  [$h(13,30), $h(16,30), 'Moodboard corporate site', 'Kleurpalet, typografie en visuele referenties verzameld.', $projects['corporate'], '#ec4899']],
            1 => [[$h(9,30), $h(12,30), 'UI kit uitbreiden webshop', 'Knoppen, formulieren en modals toegevoegd aan het design system.', $projects['webshop'], '#ec4899'],
                  [$h(13,30), $h(17), 'Designreview met Lars', 'Implementatie vergeleken met Figma-designs, feedback verwerkt.', $projects['webshop'], '#ec4899']],
            2 => [[$h(9), $h(11,30), 'Interactieve prototypes corporate', 'Klikbare prototypes gebouwd voor de eerste gebruikerstesten.', $projects['corporate'], '#ec4899'],
                  [$h(13), $h(16,30), 'TechFlow website ontwerp', 'Portfolio-sectie en over-ons pagina ontworpen.', $projects['website'], '#ec4899']],
            3 => [[$h(9,30), $h(12,30), 'Usability testing webshop', 'Testresultaten verwerkt, 7 verbeterpunten gedocumenteerd.', $projects['webshop'], '#ec4899'],
                  [$h(13,30), $h(16), 'Custom iconen & illustraties', 'Icoonset gemaakt voor de corporate website navigatie.', $projects['corporate'], '#ec4899']],
        ];
        foreach (array_merge($lastWeekShort, $thisWeekShort) as $i => $date) {
            foreach ($pattern[$i % 4] as [$s, $e, $t, $d, $p, $c]) {
                $save($nathalie, $date, $s, $e, $t, $d, $p, $c);
            }
        }

        // --- THOMAS | Digital Marketing | amber ---
        $thomas = $users['thomas'];
        $pattern = [
            0 => [[$h(9), $h(11,30), 'SEO audit Bloemenwinkel Sofie', 'Technische SEO-problemen geïdentificeerd en gerapporteerd aan klant.', $projects['seo'], '#f59e0b'],
                  [$h(13), $h(16,30), 'Google Ads campagnes opzetten', 'Zoekwoordenonderzoek afgerond, advertentiegroepen aangemaakt.', $projects['seo'], '#f59e0b']],
            1 => [[$h(9,30), $h(12), 'TechFlow website blog', 'Twee blogartikelen geschreven over webdesign trends 2026.', $projects['website'], '#f59e0b'],
                  [$h(13,30), $h(17), 'Analytics & SEO-rapport mei', 'Maandrapport opgesteld, conversies en organisch verkeer geanalyseerd.', $projects['seo'], '#f59e0b']],
            2 => [[$h(9), $h(11), 'Social media planning', 'Content kalender voor juni en juli uitgewerkt.', $projects['website'], '#f59e0b'],
                  [$h(13), $h(16,30), 'E-mailmarketing campagne', 'Nieuwsbrief voor Bloemenwinkel Sofie geschreven en opgemaakt.', $projects['seo'], '#f59e0b']],
            3 => [[$h(9,30), $h(12,30), 'Backlink strategie', 'Linkbuilding-plan opgesteld, 12 relevante gastblogmogelijkheden gevonden.', $projects['seo'], '#f59e0b'],
                  [$h(14), $h(17), 'TechFlow portfolio content', 'Drie nieuwe klantverhalen geschreven voor de portfoliopagina.', $projects['website'], '#f59e0b']],
            4 => [[$h(9), $h(11,30), 'Google Analytics 4 migratie', 'Event-tracking geconfigureerd in GA4, doelen ingesteld.', $projects['seo'], '#f59e0b'],
                  [$h(13), $h(16), 'Maandoverzicht marketing', 'Prestaties van alle kanalen samengevat in een klantrapport.', $projects['website'], '#f59e0b']],
        ];
        foreach (array_merge($lastWeek, $thisWeek) as $i => $date) {
            foreach ($pattern[$i % 5] as [$s, $e, $t, $d, $p, $c]) {
                $save($thomas, $date, $s, $e, $t, $d, $p, $c);
            }
        }

        // --- CHARLOTTE | Full-stack Senior | cyaan ---
        $charlotte = $users['charlotte'];
        $pattern = [
            0 => [[$h(9), $h(12,30), 'Webshop productdetailpagina', 'Complexe state management voor productvarianten opgelost.', $projects['webshop'], '#06b6d4'],
                  [$h(14), $h(17,30), 'API middleware architectuur', 'Middleware-stack voor Nexus API volledig herstructureerd.', $projects['api'], '#06b6d4']],
            1 => [[$h(9), $h(11,30), 'WebSocket integratie webshop', 'Realtime voorraadupdates via WebSockets geïmplementeerd.', $projects['webshop'], '#06b6d4'],
                  [$h(13,30), $h(17), 'Database query optimalisatie', 'N+1 queries opgelost, gemiddelde responstijd met 60% verlaagd.', $projects['api'], '#06b6d4']],
            2 => [[$h(9,30), $h(12), 'End-to-end tests webshop', 'Kritieke gebruikersflows getest met Playwright.', $projects['webshop'], '#06b6d4'],
                  [$h(13,30), $h(17), 'TechFlow website full-stack', 'Blog-systeem met headless CMS-integratie gebouwd.', $projects['website'], '#06b6d4']],
            3 => [[$h(9), $h(12,30), 'Redis caching strategie API', 'Caching geïmplementeerd voor veelgebruikte endpoints, TTL geconfigureerd.', $projects['api'], '#06b6d4'],
                  [$h(13,30), $h(17), 'Mentoring Jens & Lars', 'Code review sessie gegeven, best practices besproken.', $projects['stagiairs'], '#06b6d4']],
            4 => [[$h(9,30), $h(12,30), 'Security audit webshop & API', 'Penetratietest uitgevoerd, bevindingen gedocumenteerd.', $projects['webshop'], '#06b6d4'],
                  [$h(14), $h(17,30), 'Technische architectuurdocumentatie', 'ADR\'s geschreven voor de belangrijkste architectuurbeslissingen.', $projects['website'], '#06b6d4']],
        ];
        foreach (array_merge($lastWeek, $thisWeek) as $i => $date) {
            foreach ($pattern[$i % 5] as [$s, $e, $t, $d, $p, $c]) {
                $save($charlotte, $date, $s, $e, $t, $d, $p, $c);
            }
        }

        // --- JENS | Stagiair Frontend | grijs ---
        $jens = $users['jens'];
        $pattern = [
            0 => [[$h(9,30), $h(12), 'HTML & CSS componenten', 'Herbruikbare kaartcomponenten gebouwd als leeropdracht.', $projects['stagiairs'], '#6b7280'],
                  [$h(13), $h(16,30), 'TechFlow website navigatie', 'Header en navigatiebalk gemaakt onder begeleiding van Lars.', $projects['website'], '#6b7280']],
            1 => [[$h(9), $h(11,30), 'JavaScript DOM-manipulatie', 'Event listeners en dynamisch DOM-beheer geoefend en toegepast.', $projects['stagiairs'], '#6b7280'],
                  [$h(13,30), $h(17), 'Footer & contactpagina', 'Footer-componenten gebouwd en contactformulier gestyled.', $projects['website'], '#6b7280']],
            2 => [[$h(9,30), $h(12,30), 'React introductie', 'Eerste React-component gebouwd: een interactief FAQ-blok.', $projects['stagiairs'], '#6b7280'],
                  [$h(13,30), $h(16,30), 'Webshop product grid bugfix', 'Kleine layoutbug in de productlijst opgelost na code review.', $projects['webshop'], '#6b7280']],
            3 => [[$h(9), $h(12), 'useState & useEffect', 'React state management bestudeerd en toegepast in oefenproject.', $projects['stagiairs'], '#6b7280'],
                  [$h(13,30), $h(17), 'TechFlow homepage animaties', 'CSS-animaties voor de hero-sectie gemaakt en verfijnd.', $projects['website'], '#6b7280']],
            4 => [[$h(9,30), $h(12), 'Code review voorbereiding', 'Eigen code opgekuist en comments toegevoegd voor de review met Charlotte.', $projects['stagiairs'], '#6b7280'],
                  [$h(13), $h(16), 'Componentdocumentatie', 'README geschreven voor alle gebouwde leercomponenten.', $projects['website'], '#6b7280']],
        ];
        foreach (array_merge($lastWeek, $thisWeek) as $i => $date) {
            foreach ($pattern[$i % 5] as [$s, $e, $t, $d, $p, $c]) {
                $save($jens, $date, $s, $e, $t, $d, $p, $c);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Timesheet proposals (AI-voorstellen)
    // -------------------------------------------------------------------------

    private function timesheetProposals(array $users, array $projects): void
    {
        $h = fn(int $hours, int $min = 0): int => $hours * 60 + $min;

        $save = fn(User $user, string $date, int $start, int $end, string $title, string $desc, Project $project) =>
            $user->timesheetEntryProposals()->create([
                'project_id'    => $project->id,
                'worked_on'     => $date,
                'start_minutes' => $start,
                'end_minutes'   => $end,
                'title'         => $title,
                'description'   => $desc,
                'source'        => 'activitywatch',
            ]);

        // Voorstellen voor vrijdag 5 jun (vandaag) – ochtendactiviteiten die nog niet bevestigd zijn
        $save($users['lars'],     '2026-06-05', $h(8,45), $h(9,30),  'E-mails & dagplanning',       'E-mails gelezen en taken geprioriteerd voor de dag.', $projects['webshop']);
        $save($users['lars'],     '2026-06-05', $h(12,30), $h(13),   'Lunchpauze tech-nieuws',      'Frontend Weekly nieuwsbrief en CSS tricks doorgenomen.', $projects['website']);
        $save($users['emma'],     '2026-06-05', $h(8,30), $h(9),     'Slack & tickets opstarten',   'Communicatie bijgehouden, openstaande GitHub issues gelabeld.', $projects['api']);
        $save($users['emma'],     '2026-06-05', $h(12), $h(13),      'Stack Overflow research',     'Oplossing gezocht voor Redis configuratieprobleem in productie.', $projects['api']);
        $save($users['charlotte'],'2026-06-05', $h(8,45), $h(9,30),  'GitHub PR reviews',           'Pull request van Jens nagekeken en voorzien van review-opmerkingen.', $projects['stagiairs']);
        $save($users['thomas'],   '2026-06-05', $h(8,30), $h(9,15),  'Morning metrics check',       'Google Ads prestaties van de nacht doorgenomen, afwijkingen genoteerd.', $projects['seo']);
        $save($users['jens'],     '2026-06-05', $h(8,45), $h(9,30),  'React documentatie lezen',    'Officiële React-docs over hooks doorgenomen als voorbereiding op review.', $projects['stagiairs']);
    }

    // -------------------------------------------------------------------------
    // Leave requests
    // -------------------------------------------------------------------------

    private function leaveRequests(array $users): void
    {
        // Lars – goedgekeurde zomervakantie
        $users['lars']->leaveRequests()->create([
            'starts_on'  => '2026-07-01',
            'ends_on'    => '2026-07-10',
            'type'       => LeaveType::Vacation,
            'notes'      => 'Zomervakantie Italië.',
            'status'     => LeaveRequestStatus::Approved,
        ]);

        // Emma – ziekte in behandeling (komende week)
        $users['emma']->leaveRequests()->create([
            'starts_on'  => '2026-06-09',
            'ends_on'    => '2026-06-11',
            'type'       => LeaveType::Sick,
            'notes'      => 'Keelontsteking, doktersbriefje volgt.',
            'status'     => LeaveRequestStatus::Pending,
        ]);

        // Nathalie – goedgekeurde vakantie (al voorbij)
        $users['nathalie']->leaveRequests()->create([
            'starts_on'  => '2026-05-01',
            'ends_on'    => '2026-05-09',
            'type'       => LeaveType::Vacation,
            'notes'      => 'Citytrip Parijs.',
            'status'     => LeaveRequestStatus::Approved,
        ]);

        // Thomas – afgewezen vakantie
        $users['thomas']->leaveRequests()->create([
            'starts_on'         => '2026-06-16',
            'ends_on'           => '2026-06-20',
            'type'              => LeaveType::Vacation,
            'notes'             => 'Weekje weg met familie.',
            'status'            => LeaveRequestStatus::Rejected,
            'rejection_reason'  => 'Te druk door campagneweek klant Bloemenwinkel Sofie — andere datum plannen.',
        ]);

        // Charlotte – goedgekeurd overig verlof (verhuisdag)
        $users['charlotte']->leaveRequests()->create([
            'starts_on'  => '2026-06-30',
            'ends_on'    => '2026-06-30',
            'type'       => LeaveType::Other,
            'notes'      => 'Verhuisdag nieuw appartement.',
            'status'     => LeaveRequestStatus::Approved,
        ]);

        // Jens – zomerverlof in behandeling
        $users['jens']->leaveRequests()->create([
            'starts_on'  => '2026-08-11',
            'ends_on'    => '2026-08-21',
            'type'       => LeaveType::Vacation,
            'notes'      => 'Stageconclusie, daarna zomervakantie.',
            'status'     => LeaveRequestStatus::Pending,
        ]);
    }

    // -------------------------------------------------------------------------
    // Weekly status updates
    // -------------------------------------------------------------------------

    private function weeklyStatusUpdates(array $users): void
    {
        $lastWeek    = '2026-05-25';
        $twoWeeksAgo = '2026-05-18';

        $data = [
            'lars' => [
                'last' => [
                    'Responsive design is tijdrovender dan verwacht, vooral cross-browser compatibiliteit voor oudere Safari-versies.',
                    'Checkout flow volledig afronden en performance-testen uitvoeren op de webshop.',
                ],
                'two' => [
                    'Moeizame communicatie over designspecificaties, te weinig detail in de Figma-files.',
                    'Beginnen aan de filterfunctionaliteit en zorgen dat alles gesynchroniseerd is met de backend.',
                ],
            ],
            'emma' => [
                'last' => [
                    'Rate limiting correct implementeren zonder legitieme gebruikers te blokkeren was een uitdaging.',
                    'Security audit afronden en beginnen met de volledige OpenAPI-documentatie.',
                ],
                'two' => [
                    'De webhook integratie had onverwachte edge cases die niet gedekt waren in de eerste versie.',
                    'JWT refresh flow implementeren en een eerste versie van de OpenAPI-documentatie schrijven.',
                ],
            ],
            'nathalie' => [
                'last' => [
                    'Klantfeedback op de prototypes was tegenstrijdig — moeilijk om iedereen tevreden te stellen met één richting.',
                    'Definitieve UI kit afronden en usability testresultaten verwerken in verbeterde designs.',
                ],
                'two' => [
                    'Moest een groot deel van de wireframes opnieuw doen na een plotse richtingswijziging van de klant.',
                    'Interactieve prototypes bouwen en klaarstaan voor de eerste gebruikerstests.',
                ],
            ],
            'thomas' => [
                'last' => [
                    'Google Ads budget was hoger dan gepland door competitieve zoekwoorden in de bloemenbranche.',
                    'GA4-migratie afronden en een volledig maandrapport opstellen voor alle klanten.',
                ],
                'two' => [
                    'SEO-auditresultaten waren slechter dan verwacht — meer technische problemen dan ingeschat.',
                    'Content kalender uitschrijven en de eerste blogartikelen live zetten.',
                ],
            ],
            'charlotte' => [
                'last' => [
                    'N+1 query-problemen in de API waren dieper ingeworteld dan ingeschat, kostte een halve dag extra debugging.',
                    'Redis caching live zetten na team review en de security audit rapportage afronden.',
                ],
                'two' => [
                    'WebSocket integratie liep vertraging op door infrastructuurproblemen bij de hostingprovider.',
                    'Database optimalisaties doorvoeren en eindelijk de WebSocket integratie afronden.',
                ],
            ],
            'jens' => [
                'last' => [
                    'React concepten zoals useEffect en de dependency array zijn soms nog verwarrend.',
                    'Mijn eerste echte component voor de TechFlow website volledig zelfstandig afwerken.',
                ],
                'two' => null,
            ],
        ];

        foreach ($data as $key => $weeks) {
            if ($weeks['two'] !== null) {
                WeeklyStatusUpdate::create([
                    'user_id'              => $users[$key]->id,
                    'week_start'           => $twoWeeksAgo,
                    'difficult_this_week'  => $weeks['two'][0],
                    'plans_next_week'      => $weeks['two'][1],
                ]);
            }

            WeeklyStatusUpdate::create([
                'user_id'              => $users[$key]->id,
                'week_start'           => $lastWeek,
                'difficult_this_week'  => $weeks['last'][0],
                'plans_next_week'      => $weeks['last'][1],
            ]);
        }
    }

    // -------------------------------------------------------------------------
    // Weekly debrief summary
    // -------------------------------------------------------------------------

    private function weeklyDebriefSummary(Organization $org): void
    {
        DB::table('weekly_debrief_summaries')->insert([
            'organization_id' => $org->id,
            'week_start'      => '2026-05-25',
            'submitted_count' => 6,
            'total_members'   => 6,
            'content'         => implode("\n\n", [
                '## Samenvatting weekstatus 26–30 mei 2026',
                '### Uitdagingen',
                'Een productieve maar veeleisende week voor het team. De voornaamste uitdagingen lagen in **technische complexiteit** en **klantcommunicatie**. Lars en Charlotte liepen aan tegen diepgewortelde performance-problemen in de webshop-codebase. Emma stuitte op onverwachte edge cases bij de webhook-integraties voor Nexus Logistics. Nathalie ondervond frustratie door tegenstrijdige klantfeedback. Thomas merkte dat het advertentiebudget voor Bloemenwinkel Sofie sneller opging dan gepland door hoge concurrentie op de doelzoekwoorden.',
                '### Plannen voor volgende week',
                'Het team focust op **afronding en kwaliteitsbewaking**: de checkout flow van Maes Retail, de security audit voor het API Platform en de definitieve UI kit voor de corporate website staan bovenaan de agenda. Thomas richt zich op de GA4-migratie en het maandrapport. Jens wil zijn eerste zelfstandige component opleveren voor de TechFlow website.',
                '### Algehele indruk',
                'Ondanks de uitdagingen laat het team solide vooruitgang zien op alle projecten. De samenwerking tussen frontend, backend en design verloopt goed. Aandachtspunt voor volgende week: duidelijkere designspecificaties bij handoff om iteraties te beperken.',
            ]),
            'created_at'      => '2026-05-30 16:48:00',
            'updated_at'      => '2026-05-30 16:48:00',
        ]);
    }

    // -------------------------------------------------------------------------
    // In-app notifications
    // -------------------------------------------------------------------------

    private function notifications(array $users): void
    {
        $insert = function (User $user, string $type, string $title, string $message, ?string $readAt, string $createdAt): void {
            DB::table('notifications')->insert([
                'id'              => Str::uuid()->toString(),
                'type'            => $type,
                'notifiable_type' => 'App\\Models\\User',
                'notifiable_id'   => $user->id,
                'data'            => json_encode(['title' => $title, 'message' => $message]),
                'read_at'         => $readAt,
                'created_at'      => $createdAt,
                'updated_at'      => $createdAt,
            ]);
        };

        $approved  = 'App\\Notifications\\LeaveRequestApprovedNotification';
        $rejected  = 'App\\Notifications\\LeaveRequestRejectedNotification';
        $submitted = 'App\\Notifications\\LeaveRequestSubmittedNotification';

        // Lars – goedgekeurd zomerverlof (gelezen)
        $insert($users['lars'], $approved,
            'Verlof goedgekeurd',
            'Vakantie (1 jul – 10 jul 2026) is goedgekeurd.',
            '2026-06-02 09:10:00', '2026-06-01 14:30:00');

        // Thomas – afgewezen verlof (ongelezen)
        $insert($users['thomas'], $rejected,
            'Verlof afgewezen',
            'Vakantie (16 jun – 20 jun 2026). Reden: Te druk door campagneweek klant Bloemenwinkel Sofie — andere datum plannen.',
            null, '2026-06-03 10:00:00');

        // Nathalie – goedgekeurd verlof mei (gelezen, oud)
        $insert($users['nathalie'], $approved,
            'Verlof goedgekeurd',
            'Vakantie (1 mei – 9 mei 2026) is goedgekeurd.',
            '2026-04-28 08:30:00', '2026-04-27 15:00:00');

        // Charlotte – goedgekeurd overig verlof (ongelezen)
        $insert($users['charlotte'], $approved,
            'Verlof goedgekeurd',
            'Overig verlof (30 jun 2026) is goedgekeurd.',
            null, '2026-06-04 11:00:00');

        // Admin (Mauro) – ingediende verlofaanvragen (inbox)
        $insert($users['mauro'], $submitted,
            'Verlofaanvraag ingediend',
            'Emma Peeters heeft een verlofaanvraag ingediend (Ziekte, 9 jun – 11 jun).',
            null, '2026-06-05 09:00:00');

        $insert($users['mauro'], $submitted,
            'Verlofaanvraag ingediend',
            'Jens Claes heeft een verlofaanvraag ingediend (Vakantie, 11 aug – 21 aug).',
            '2026-06-05 09:45:00', '2026-06-04 16:00:00');
    }

    // -------------------------------------------------------------------------
    // Timy conversations
    // -------------------------------------------------------------------------

    private function timyConversations(array $users): void
    {
        $conversations = [
            'lars' => [
                'title'    => 'Uren registreren op een project',
                'messages' => [
                    ['user',      'Hoe kan ik mijn uren registreren op het webshop-project?'],
                    ['assistant', "Ga naar **Timesheets** in de zijbalk. Klik op een leeg tijdslot in de kalender:\n\n1. Geef je activiteit een titel\n2. Selecteer 'Webshop Renovatie' in de projectdropdown\n3. Stel start- en eindtijd in\n4. Sla op met de knop onderin\n\nJe kunt tijdblokken ook slepen en aan de randen aanpassen om het tijdslot te wijzigen. Heb je nog vragen?"],
                ],
            ],
            'emma' => [
                'title'    => 'Verlofaanvraag indienen bij ziekte',
                'messages' => [
                    ['user',      'Ik ben ziek volgende week. Hoe dien ik een verlofaanvraag in?'],
                    ['assistant', "Beterschap! Zo dien je een ziekteverlof in:\n\n1. Ga naar **Leave requests** in de zijbalk\n2. Klik op 'Nieuwe aanvraag'\n3. Kies het type **Ziekte**\n4. Selecteer de begin- en einddatum\n5. Upload optioneel een doktersbrief (PDF of afbeelding, max 5 MB)\n6. Dien in — je beheerder krijgt meteen een melding\n\nJe ontvangt een notificatie zodra je aanvraag goedgekeurd of afgewezen is."],
                ],
            ],
            'nathalie' => [
                'title'    => 'Weekstatus invullen',
                'messages' => [
                    ['user',      'Wat is de weekstatus en hoe vul ik die in?'],
                    ['assistant', "De weekstatus is een korte wekelijkse reflectie met twee vragen:\n\n- **Wat was moeilijk deze week?**\n- **Wat doe je volgende week?**\n\nJe vindt de weekstatus via **Projects** → de knop 'Weekstatus' bovenaan de pagina. Als de deadline nadert verschijnt er een rood herinneringsbolletje.\n\n**Tip:** Gebruik de AI-voorstelknop om automatisch een concept te genereren op basis van je geregistreerde uren!"],
                ],
            ],
            'thomas' => [
                'title'    => 'Verlof afgewezen — wat nu?',
                'messages' => [
                    ['user',      'Mijn vakantieaanvraag is afgewezen. Wat kan ik doen?'],
                    ['assistant', "Vervelend! Je vindt de afwijzingsreden terug in **Leave requests**.\n\nJe opties:\n1. **Nieuwe aanvraag** indienen voor andere datums\n2. Contact opnemen met je beheerder om alternatieve data te bespreken\n3. Aanvraag bewerken als de periode flexibel is\n\nWil je dat ik je help een nieuwe aanvraag op te stellen voor andere datums deze zomer?"],
                ],
            ],
            'charlotte' => [
                'title'    => 'AI-voorstellen in timesheets',
                'messages' => [
                    ['user',      'Hoe werken de AI-voorstellen in de timesheets precies?'],
                    ['assistant', "De AI-voorstellen worden gegenereerd op basis van je **desktop tracker** activiteit:\n\n1. De desktop tracker registreert welke apps en vensters je gebruikt\n2. De AI analyseert deze activiteit en groepeert gerelateerde taken\n3. Hij stelt tijdblokken voor met titel, tijdslot en projectsuggestie\n\nIn de timesheets vind je het voorstellenpaneel bovenaan. Per voorstel kun je:\n- ✅ **Goedkeuren** → wordt direct een entry in je kalender\n- ✏️ **Bewerken** → aanpassen voor je bevestigt\n- 🗑️ **Verwijderen** → voorstel weggooien\n\nKlik op **'Genereer voor vandaag'** om nieuwe voorstellen aan te vragen."],
                ],
            ],
            'jens' => [
                'title'    => 'Welkom bij TechFlow Digital',
                'messages' => [
                    ['user',      'Hoi Timy! Ik ben net begonnen als stagiair bij TechFlow. Waar begin ik?'],
                    ['assistant', "Welkom bij TechFlow Digital, Jens!\n\nHier zijn je eerste stappen:\n\n1. **Timesheets** — registreer dagelijks je uren, ook kleine taken\n2. **Projects** — bekijk het project *Stagiairs Leerlijn* voor je leertaken\n3. **Teams** — je zit in het team *Frontend Development*\n4. **Weekstatus** — vul elke vrijdag een korte weekreflectie in\n\nAls je vragen hebt over de app of je taken, vraag het gerust aan mij. Veel succes met je stage!"],
                ],
            ],
        ];

        foreach ($conversations as $key => $conv) {
            $convId = DB::table('timy_conversations')->insertGetId([
                'user_id'    => $users[$key]->id,
                'title'      => $conv['title'],
                'created_at' => now()->subDays(4),
                'updated_at' => now()->subDays(1),
            ]);

            foreach ($conv['messages'] as $offset => [$role, $content]) {
                DB::table('timy_messages')->insert([
                    'timy_conversation_id' => $convId,
                    'role'                 => $role,
                    'content'              => $content,
                    'actions'              => null,
                    'pending_action'       => null,
                    'created_at'           => now()->subDays(4)->addMinutes($offset * 3),
                    'updated_at'           => now()->subDays(4)->addMinutes($offset * 3),
                ]);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Desktop activities (voor de tracker-demo)
    // -------------------------------------------------------------------------

    private function desktopActivities(User $user): void
    {
        $activities = [
            // Donderdag 4 jun
            ['2026-06-04 08:55', '2026-06-04 09:25', 'Google Chrome',    'E-mail inbox — Outlook Web',                              null,                                   'outlook.live.com'],
            ['2026-06-04 09:30', '2026-06-04 10:25', 'Google Chrome',    'Nexus Logistics — API Platform Jira Board',               'https://jira.nexuslogistics.be/board', 'jira.nexuslogistics.be'],
            ['2026-06-04 10:30', '2026-06-04 11:55', 'Google Chrome',    'TimeTraq — Urenrapportage Q2',                            null,                                   null],
            ['2026-06-04 13:30', '2026-06-04 14:55', 'Microsoft Teams',  'Meeting: Maes Retail — Sprint review Q2',                 null,                                   null],
            ['2026-06-04 15:00', '2026-06-04 16:25', 'Google Chrome',    'Van den Berg & Partners — Google Drive projectdossier',   'https://drive.google.com/folders/vdb', 'drive.google.com'],
            ['2026-06-04 16:30', '2026-06-04 17:30', 'Google Chrome',    'TimeTraq — Admin dashboard',                              null,                                   null],
            // Vrijdag 5 jun
            ['2026-06-05 09:00', '2026-06-05 09:20', 'Slack',            'TechFlow Digital — #algemeen',                           null,                                   null],
            ['2026-06-05 09:25', '2026-06-05 11:45', 'Google Chrome',    'TimeTraq — Weekstatus debrief',                           null,                                   null],
            ['2026-06-05 13:00', '2026-06-05 14:55', 'Google Chrome',    'Nexus Logistics — Voortgangsrapport Q2.pdf',              null,                                   null],
            ['2026-06-05 15:00', '2026-06-05 15:25', 'Slack',            'TechFlow Digital — #projecten',                          null,                                   null],
            ['2026-06-05 15:30', '2026-06-05 17:30', 'Google Chrome',    'TechFlow Digital — Portfoliowebsite beheer',              null,                                   null],
        ];

        foreach ($activities as [$startAt, $endAt, $app, $title, $url, $domain]) {
            $start = CarbonImmutable::parse($startAt);
            $end   = CarbonImmutable::parse($endAt);

            DB::table('desktop_activities')->insert([
                'user_id'          => $user->id,
                'app_name'         => $app,
                'window_title'     => $title,
                'browser_url'      => $url,
                'browser_domain'   => $domain,
                'browser_tab_title' => null,
                'started_at'       => $start,
                'ended_at'         => $end,
                'duration_seconds' => $end->diffInSeconds($start),
                'created_at'       => $start,
                'updated_at'       => $end,
            ]);
        }
    }

    // -------------------------------------------------------------------------
    // Organization invite
    // -------------------------------------------------------------------------

    private function organizationInvite(Organization $org, User $creator): void
    {
        DB::table('organization_invites')->insert([
            'organization_id'      => $org->id,
            'email'                => 'stagiair@techflow.be',
            'token'                => Str::random(64),
            'expires_at'           => now()->addDays(7),
            'created_by_user_id'   => $creator->id,
            'redeemed_at'          => null,
            'redeemed_by_user_id'  => null,
            'created_at'           => now()->subDay(),
            'updated_at'           => now()->subDay(),
        ]);
    }
}
