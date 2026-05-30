<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->string('type')->default('vacation')->after('ends_on');
            $table->text('notes')->nullable()->after('type');
            $table->text('rejection_reason')->nullable()->after('status');
        });

        DB::table('leave_requests')->orderBy('id')->each(function (object $row): void {
            $type = match (mb_strtolower(trim((string) $row->label))) {
                'vakantie' => 'vacation',
                'ziekte' => 'sick',
                'persoonlijk verlof' => 'personal',
                default => 'other',
            };

            DB::table('leave_requests')->where('id', $row->id)->update(['type' => $type]);
        });

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn('label');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedSmallInteger('annual_leave_days')->default(25)->after('can_create_projects');
        });
    }

    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->string('label')->default('')->after('ends_on');
        });

        DB::table('leave_requests')->orderBy('id')->each(function (object $row): void {
            $label = match ((string) $row->type) {
                'vacation' => 'Vakantie',
                'sick' => 'Ziekte',
                'personal' => 'Persoonlijk verlof',
                default => 'Overig',
            };

            DB::table('leave_requests')->where('id', $row->id)->update(['label' => $label]);
        });

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn(['type', 'notes', 'rejection_reason']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('annual_leave_days');
        });
    }
};
