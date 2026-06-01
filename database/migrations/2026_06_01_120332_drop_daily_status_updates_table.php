<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('daily_status_updates');
    }

    public function down(): void
    {
        if (Schema::hasTable('daily_status_updates')) {
            return;
        }

        Schema::create('daily_status_updates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('status_date');
            $table->text('completed_today');
            $table->text('planned_today');
            $table->text('planned_tomorrow');
            $table->timestamps();

            $table->unique(['user_id', 'status_date']);
            $table->index(['user_id', 'status_date']);
        });
    }
};
