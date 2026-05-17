<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('desktop_activities', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('app_name');
            $table->string('window_title', 2000);
            $table->string('browser_url', 2000)->nullable();
            $table->string('browser_domain')->nullable();
            $table->string('browser_tab_title', 2000)->nullable();
            $table->timestamp('started_at');
            $table->timestamp('ended_at');
            $table->unsignedInteger('duration_seconds');
            $table->timestamps();

            $table->index(['user_id', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('desktop_activities');
    }
};
