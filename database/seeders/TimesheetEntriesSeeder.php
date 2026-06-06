<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TimesheetEntriesSeeder extends Seeder
{
    public function run(): void
    {
        $userIds    = DB::table('users')->where('organization_id', 2)->pluck('id')->toArray();
        $projectIds = DB::table('projects')->where('organization_id', 2)->pluck('id')->toArray();

        // Vorige week (ma-vr) + huidige week (ma-vr)
        $dates = [
            '2026-05-25', '2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29',
            '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05',
        ];

        $slots = [
            [9 * 60,       11 * 60],
            [11 * 60 + 30, 13 * 60],
            [14 * 60,      16 * 60],
            [16 * 60 + 30, 17 * 60 + 30],
        ];

        $titles = [
            'Development sprint',
            'Design review',
            'Klantoverleg',
            'Code review',
            'Testing & QA',
            'Documentatie',
            'Planning sessie',
            'Bug fixes',
            'Feature implementatie',
            'Retrospective',
        ];

        $colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6b7280'];

        $now = now()->toDateTimeString();
        $rows = [];

        foreach ($userIds as $userId) {
            foreach ($dates as $date) {
                // 2 entries per dag per user
                $daySlots = array_slice($slots, ($userId % 2), 2);

                foreach ($daySlots as $i => [$start, $end]) {
                    $rows[] = [
                        'user_id'       => $userId,
                        'project_id'    => $projectIds[($userId + $i) % count($projectIds)],
                        'worked_on'     => $date,
                        'title'         => $titles[($userId + $i) % count($titles)],
                        'description'   => null,
                        'color'         => $colors[$userId % count($colors)],
                        'start_minutes' => $start,
                        'end_minutes'   => $end,
                        'created_at'    => $now,
                        'updated_at'    => $now,
                    ];
                }
            }
        }

        // Insert in batches om memory te beperken
        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('timesheet_entries')->insert($chunk);
        }

        $this->command->info(count($rows).' timesheet entries aangemaakt voor '.count($userIds).' gebruikers.');
    }
}
