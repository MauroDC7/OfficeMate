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
        Schema::create('timesheet_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('worked_on');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('client_name')->nullable();
            $table->unsignedSmallInteger('start_minutes');
            $table->unsignedSmallInteger('end_minutes');
            $table->timestamps();

            $table->index(['user_id', 'worked_on']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('timesheet_entries');
    }
};
