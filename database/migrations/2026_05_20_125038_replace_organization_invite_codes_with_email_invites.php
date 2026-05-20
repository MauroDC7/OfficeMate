<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('organization_invites')->delete();

        Schema::table('organization_invites', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->dropColumn('code');
        });

        Schema::table('organization_invites', function (Blueprint $table) {
            $table->string('email')->after('organization_id');
            $table->string('token', 64)->unique()->after('email');
            $table->timestamp('expires_at')->after('token');
        });
    }

    public function down(): void
    {
        Schema::table('organization_invites', function (Blueprint $table) {
            $table->dropUnique(['token']);
            $table->dropColumn(['email', 'token', 'expires_at']);
        });

        Schema::table('organization_invites', function (Blueprint $table) {
            $table->string('code', 16)->unique()->after('organization_id');
        });
    }
};
