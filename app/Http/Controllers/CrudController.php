<?php

namespace App\Http\Controllers;

use App\Models\TimesheetEntry;
use App\Models\User;

abstract class CrudController extends Controller
{
    protected function mustOwn(?User $user, TimesheetEntry $entry): void
    {
        abort_unless($user !== null && $user->id === $entry->user_id, 403);
    }
}
