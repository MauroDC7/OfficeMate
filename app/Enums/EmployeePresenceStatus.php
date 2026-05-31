<?php

namespace App\Enums;

enum EmployeePresenceStatus: string
{
    case InOffice = 'in_office';
    case OutOfOffice = 'out_of_office';
    case Vacation = 'vacation';
    case Sick = 'sick';
    case OtherLeave = 'other_leave';

    public function label(): string
    {
        return match ($this) {
            self::InOffice => 'Op kantoor',
            self::OutOfOffice => 'Niet op kantoor',
            self::Vacation => 'Vakantie',
            self::Sick => 'Ziekte',
            self::OtherLeave => 'Overig verlof',
        };
    }
}
