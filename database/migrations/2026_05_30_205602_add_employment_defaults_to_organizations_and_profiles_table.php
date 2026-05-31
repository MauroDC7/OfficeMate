<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table): void {
            $table->unsignedSmallInteger('default_weekly_work_hours')->default(40)->after('name');
            $table->unsignedSmallInteger('default_annual_leave_days')->default(25)->after('default_weekly_work_hours');
        });

        Schema::create('employment_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedSmallInteger('weekly_work_hours');
            $table->unsignedSmallInteger('annual_leave_days');
            $table->timestamps();

            $table->unique(['organization_id', 'name']);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->foreignId('employment_profile_id')
                ->nullable()
                ->after('weekly_work_hours')
                ->constrained('employment_profiles')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('employment_profile_id');
        });

        Schema::dropIfExists('employment_profiles');

        Schema::table('organizations', function (Blueprint $table): void {
            $table->dropColumn(['default_weekly_work_hours', 'default_annual_leave_days']);
        });
    }
};
