<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('tracker_use_ai_for_proposals')->default(true)->after('task_availability');
            $table->json('tracker_blocklist')->nullable()->after('tracker_use_ai_for_proposals');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['tracker_use_ai_for_proposals', 'tracker_blocklist']);
        });
    }
};
