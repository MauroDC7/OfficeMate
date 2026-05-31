<?php

namespace App\Enums;

enum LeaveType: string
{
    case Vacation = 'vacation';
    case Sick = 'sick';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Vacation => 'Vakantie',
            self::Sick => 'Ziekte',
            self::Other => 'Overig',
        };
    }

    public function requiresAttachment(): bool
    {
        return $this === self::Sick;
    }
}
