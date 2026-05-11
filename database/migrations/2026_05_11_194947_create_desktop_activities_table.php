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
        Schema::create('desktop_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('app_name', 255);
            $table->string('window_title', 2000);
            $table->text('browser_url')->nullable();
            $table->string('browser_domain', 255)->nullable();
            $table->string('browser_tab_title', 2000)->nullable();
            $table->timestampTz('started_at');
            $table->timestampTz('ended_at');
            $table->unsignedInteger('duration_seconds');
            $table->timestamps();

            $table->index(['user_id', 'started_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('desktop_activities');
    }
};
