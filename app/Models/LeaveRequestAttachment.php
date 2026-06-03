<?php

namespace App\Models;

use Database\Factories\LeaveRequestAttachmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @use HasFactory<LeaveRequestAttachmentFactory>
 */
#[Fillable(['leave_request_id', 'path', 'original_name', 'mime_type', 'size_bytes'])]
class LeaveRequestAttachment extends Model
{
    /** @use HasFactory<LeaveRequestAttachmentFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<LeaveRequest, $this>
     */
    public function leaveRequest(): BelongsTo
    {
        return $this->belongsTo(LeaveRequest::class);
    }
}
