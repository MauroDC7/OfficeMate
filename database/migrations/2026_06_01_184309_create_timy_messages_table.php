<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('timy_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('timy_conversation_id')->constrained()->cascadeOnDelete();
            $table->string('role', 20);
            $table->text('content');
            $table->json('actions')->nullable();
            $table->timestamps();

            $table->index(['timy_conversation_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timy_messages');
    }
};
