<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->timestamp('organization_joined_at')->nullable()->after('organization_id');
            $table->timestamp('employment_setup_completed_at')->nullable()->after('employment_profile_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['organization_joined_at', 'employment_setup_completed_at']);
        });
    }
};
