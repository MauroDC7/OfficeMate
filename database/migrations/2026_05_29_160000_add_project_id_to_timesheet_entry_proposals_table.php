<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('timesheet_entry_proposals', 'project_id')) {
            return;
        }

        Schema::table('timesheet_entry_proposals', function (Blueprint $table) {
            $table->foreignId('project_id')
                ->nullable()
                ->after('user_id')
                ->constrained()
                ->nullOnDelete();

            $table->index('project_id');
        });
    }

    public function down(): void
    {
        Schema::table('timesheet_entry_proposals', function (Blueprint $table) {
            $table->dropConstrainedForeignId('project_id');
        });
    }
};
