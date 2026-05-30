<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('leave_requests')
            ->where('type', 'personal')
            ->update(['type' => 'other']);
    }

    public function down(): void
    {
        // Oud type niet meer ondersteund; geen terugzetting naar personal.
    }
};
