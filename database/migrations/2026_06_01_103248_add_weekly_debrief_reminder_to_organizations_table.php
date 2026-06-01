<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->unsignedTinyInteger('weekly_debrief_reminder_weekday')->default(5)->after('office_ip_addresses');
            $table->string('weekly_debrief_reminder_time', 5)->default('15:00')->after('weekly_debrief_reminder_weekday');
        });
    }

    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn([
                'weekly_debrief_reminder_weekday',
                'weekly_debrief_reminder_time',
            ]);
        });
    }
};
