<?php

use App\Models\Organization;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table): void {
            $table->string('name_normalized')->nullable()->after('name');
        });

        $seen = [];

        Organization::query()
            ->orderBy('id')
            ->each(function (Organization $organization) use (&$seen): void {
                $normalized = Organization::normalizedName($organization->name);

                if (isset($seen[$normalized])) {
                    $normalized = $normalized.'-'.$organization->id;
                }

                $seen[$normalized] = true;

                DB::table('organizations')
                    ->where('id', $organization->id)
                    ->update(['name_normalized' => $normalized]);
            });

        Schema::table('organizations', function (Blueprint $table): void {
            $table->string('name_normalized')->nullable(false)->change();
            $table->unique('name_normalized');
        });
    }

    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table): void {
            $table->dropUnique(['name_normalized']);
            $table->dropColumn('name_normalized');
        });
    }
};
