<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

final class LegalController extends Controller
{
    public function privacy(): Response
    {
        $path = resource_path('legal/privacybeleid.nl.md');

        abort_unless(File::exists($path), 404);

        $markdown = File::get($path);

        return Inertia::render('privacy-policy', [
            'title' => 'Privacybeleid',
            'contentHtml' => $this->formatLegalHtml(Str::markdown($markdown)),
            'lastUpdated' => '25 mei 2026',
        ]);
    }

    private function formatLegalHtml(string $html): string
    {
        return str_replace(
            '<table>',
            '<div class="legal-table-wrap"><table>',
            str_replace('</table>', '</table></div>', $html),
        );
    }
}
