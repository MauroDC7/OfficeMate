<?php

namespace Database\Seeders;

use App\Enums\ProjectStatus;
use App\Enums\ProjectType;
use App\Models\Project;
use Illuminate\Database\Seeder;

class ProjectsSeeder extends Seeder
{
    public function run(): void
    {
        $organizationId = 2;
        $createdBy = 1;

        $projects = [
            ['Webshop Renovatie',              ProjectType::External, ProjectStatus::InProgress,      'Maes Retail NV',           200, true],
            ['Corporate Website Herontwerp',   ProjectType::External, ProjectStatus::InProgress,      'Van den Berg & Partners',  160, true],
            ['API Platform v2',                ProjectType::External, ProjectStatus::InProgress,      'Nexus Logistics',          300, true],
            ['SEO & Google Ads',               ProjectType::External, ProjectStatus::WaitingForClient,'Bloemenwinkel Sofie',        80, true],
            ['Branding & Huisstijl',           ProjectType::External, ProjectStatus::Done,            'Startup Hub Gent',         120, false],
            ['Mobiele App Redesign',           ProjectType::External, ProjectStatus::InProgress,      'Delhaize Group',           250, true],
            ['E-learning Platform',            ProjectType::External, ProjectStatus::OnHold,          'KdG Hogeschool',           180, true],
            ['Intranet Portaal',               ProjectType::External, ProjectStatus::InProgress,      'Stad Antwerpen',           400, true],
            ['Stagiairs Leerlijn',             ProjectType::Internal, ProjectStatus::InProgress,      null,                      null, true],
            ['TechFlow Website',               ProjectType::Internal, ProjectStatus::InProgress,      null,                       100, true],
        ];

        foreach ($projects as [$name, $type, $status, $client, $budget, $active]) {
            Project::firstOrCreate(
                ['organization_id' => $organizationId, 'name' => $name],
                [
                    'type'         => $type,
                    'status'       => $status,
                    'client_name'  => $client,
                    'hours_budget' => $budget,
                    'is_active'    => $active,
                    'created_by'   => $createdBy,
                ],
            );
        }

        $this->command->info('Projecten aangemaakt voor organisatie #'.$organizationId.'.');
    }
}
