<?php

namespace App\Services;

use App\Models\LeaveRequest;
use App\Models\LeaveRequestAttachment;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

final class LeaveRequestMedicalCertificateStorage
{
    public function store(LeaveRequest $leaveRequest, UploadedFile $file): LeaveRequestAttachment
    {
        $this->deleteFor($leaveRequest);

        $path = $file->store(
            'leave-requests/'.$leaveRequest->id,
            'local',
        );

        return $leaveRequest->attachments()->create([
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size_bytes' => $file->getSize(),
        ]);
    }

    public function deleteFor(LeaveRequest $leaveRequest): void
    {
        $leaveRequest->loadMissing('attachments');

        foreach ($leaveRequest->attachments as $attachment) {
            Storage::disk('local')->delete($attachment->path);
            $attachment->delete();
        }
    }
}
