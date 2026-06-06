<?php

namespace App\Enums;

enum TaskAvailability: string
{
    case OnTask = 'on_task';
    case OpenForTasks = 'open_for_tasks';

    public function label(): string
    {
        return match ($this) {
            self::OnTask => 'Bezig met taak',
            self::OpenForTasks => 'Open voor taken',
        };
    }
}
