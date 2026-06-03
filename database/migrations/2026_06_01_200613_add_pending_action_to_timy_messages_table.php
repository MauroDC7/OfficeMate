<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timy_messages', function (Blueprint $table) {
            $table->json('pending_action')->nullable()->after('actions');
        });
    }

    public function down(): void
    {
        Schema::table('timy_messages', function (Blueprint $table) {
            $table->dropColumn('pending_action');
        });
    }
};
