<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->default('');
            $table->string('last_name')->default('');
            $table->string('role', 20)->default('employee');
        });

        foreach (DB::table('users')->select(['id', 'name'])->cursor() as $row) {
            $trimmed = trim((string) ($row->name ?? ''));
            $parts = $trimmed === '' ? ['', ''] : preg_split('/\s+/', $trimmed, 2);
            $first = (string) ($parts[0] ?? '');
            $last = (string) ($parts[1] ?? '');
            DB::table('users')->where('id', $row->id)->update([
                'first_name' => $first !== '' ? $first : 'Gebruiker',
                'last_name' => $last,
            ]);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->default('');
        });

        foreach (DB::table('users')->select(['id', 'first_name', 'last_name'])->cursor() as $row) {
            $combined = trim(trim((string) ($row->first_name ?? '')).' '.trim((string) ($row->last_name ?? '')));
            DB::table('users')->where('id', $row->id)->update([
                'name' => $combined !== '' ? $combined : 'Gebruiker',
            ]);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'last_name', 'role']);
        });
    }
};
