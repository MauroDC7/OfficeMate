<?php

namespace App\Enums;

enum ProjectStatus: string
{
    case InProgress = 'in_progress';
    case OnHold = 'on_hold';
    case WaitingForClient = 'waiting_for_client';
    case Done = 'done';
}
