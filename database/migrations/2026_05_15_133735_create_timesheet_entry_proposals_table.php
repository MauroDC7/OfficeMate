<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('timesheet_entry_proposals', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('worked_on');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('client_name')->nullable();
            $table->unsignedSmallInteger('start_minutes');
            $table->unsignedSmallInteger('end_minutes');
            $table->string('source')->default('activitywatch');
            $table->timestamps();

            $table->index(['user_id', 'worked_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timesheet_entry_proposals');
    }
};
