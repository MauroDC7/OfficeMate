<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

final class ProjectLogoStorage
{
    public function store(UploadedFile $file): string
    {
        return $file->store('project-logos', 'public');
    }

    public function delete(?string $path): void
    {
        if ($path === null || $path === '') {
            return;
        }

        Storage::disk('public')->delete($path);
    }
}
