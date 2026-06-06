<?php

namespace Database\Seeders;

use App\Enums\TaskAvailability;
use App\Enums\UserRole;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ExtraUsersSeeder extends Seeder
{
    public function run(): void
    {
        $organizationId = 2;
        $password = Hash::make('password');
        $joined = CarbonImmutable::parse('2025-09-01 08:00:00');

        $users = [
            ['Lena',      'Martens',    'lena.martens'],
            ['Pieter',    'Claes',      'pieter.claes'],
            ['Sofie',     'De Wolf',    'sofie.dewolf'],
            ['Jonas',     'Vermeersch', 'jonas.vermeersch'],
            ['Amber',     'Jacobs',     'amber.jacobs'],
            ['Ruben',     'Goossens',   'ruben.goossens'],
            ['Fien',      'Bogaert',    'fien.bogaert'],
            ['Mathias',   'Leclercq',   'mathias.leclercq'],
            ['Elien',     'Desmet',     'elien.desmet'],
            ['Wout',      'Vandenberghe','wout.vandenberghe'],
            ['Julie',     'Hermans',    'julie.hermans'],
            ['Bram',      'Peeters',    'bram.peeters'],
            ['Lore',      'Michiels',   'lore.michiels'],
            ['Dries',     'Willems',    'dries.willems'],
            ['Hanne',     'Van Damme',  'hanne.vandamme'],
            ['Stef',      'Baert',      'stef.baert'],
            ['Laura',     'Smeets',     'laura.smeets'],
            ['Niels',     'De Graef',   'niels.degraef'],
            ['An',        'Wouters',    'an.wouters'],
            ['Kevin',     'Nijs',       'kevin.nijs'],
            ['Elisa',     'Puts',       'elisa.puts'],
            ['Tibo',      'Hendrickx',  'tibo.hendrickx'],
        ];

        foreach ($users as [$firstName, $lastName, $emailPrefix]) {
            User::firstOrCreate(
                ['email' => "{$emailPrefix}@techflow.be"],
                [
                    'first_name'                    => $firstName,
                    'last_name'                     => $lastName,
                    'password'                      => $password,
                    'role'                          => UserRole::Employee,
                    'organization_id'               => $organizationId,
                    'organization_joined_at'        => $joined,
                    'email_verified_at'             => $joined,
                    'privacy_policy_accepted_at'    => $joined,
                    'weekly_work_hours'             => 40,
                    'annual_leave_days'             => 25,
                    'task_availability'             => TaskAvailability::OpenForTasks,
                    'employment_setup_completed_at' => $joined,
                    'tracker_use_ai_for_proposals'  => true,
                    'tracker_tracking_enabled'      => true,
                ],
            );
        }

        $this->command->info('22 extra gebruikers aangemaakt voor organisatie #'.$organizationId.'.');
    }
}
