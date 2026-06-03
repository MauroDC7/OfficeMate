<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table): void {
            $table->json('office_ip_addresses')->nullable()->after('default_annual_leave_days');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->timestamp('last_seen_at_office')->nullable()->after('employment_setup_completed_at');
        });
    }

    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table): void {
            $table->dropColumn('office_ip_addresses');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('last_seen_at_office');
        });
    }
};
