<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (! Schema::hasColumn('projects', 'organization_id')) {
                $table->foreignId('organization_id')
                    ->nullable()
                    ->after('id')
                    ->constrained()
                    ->cascadeOnDelete();
            }

            if (! Schema::hasColumn('projects', 'type')) {
                $table->string('type')->default('external')->after('name');
            }

            if (! Schema::hasColumn('projects', 'status')) {
                $table->string('status')->default('in_progress')->after('type');
            }

            if (! Schema::hasColumn('projects', 'hours_budget')) {
                $table->unsignedInteger('hours_budget')->nullable()->after('status');
            }

            if (! Schema::hasColumn('projects', 'created_by')) {
                $table->foreignId('created_by')
                    ->nullable()
                    ->after('client_name')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('projects', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }
        });

        if (Schema::hasColumn('projects', 'budget_minutes')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->dropColumn('budget_minutes');
            });
        }

        if (
            Schema::hasColumn('projects', 'organization_id')
            && Schema::hasColumn('projects', 'status')
        ) {
            Schema::table('projects', function (Blueprint $table) {
                $table->index(['organization_id', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }

            if (Schema::hasColumn('projects', 'organization_id')) {
                $table->dropConstrainedForeignId('organization_id');
            }

            $table->dropColumn(['type', 'status', 'hours_budget']);
        });
    }
};
