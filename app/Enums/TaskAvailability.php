<?php

namespace App\Enums;

enum TaskAvailability: string
{
    case OnTask = 'on_task';
    case OpenForTasks = 'open_for_tasks';

    public function label(): string
    {
        return match ($this) {
            self::OnTask => 'On task',
            self::OpenForTasks => 'Open for tasks',
        };
    }
}
