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
        return $this->renderLegalPage(
            'legal/privacybeleid.nl.md',
            'privacy-policy',
            'Privacybeleid',
            '25 mei 2026',
        );
    }

    public function aboutTimeTraq(): Response
    {
        return $this->renderLegalPage(
            'legal/over-timetraq.nl.md',
            'about-timetraq',
            'Over TimeTraq',
            null,
        );
    }

    private function renderLegalPage(
        string $markdownPath,
        string $page,
        string $title,
        ?string $lastUpdated,
    ): Response {
        $path = resource_path($markdownPath);

        abort_unless(File::exists($path), 404);

        $markdown = File::get($path);

        return Inertia::render($page, [
            'title' => $title,
            'contentHtml' => $this->formatLegalHtml(Str::markdown($markdown)),
            'lastUpdated' => $lastUpdated,
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
