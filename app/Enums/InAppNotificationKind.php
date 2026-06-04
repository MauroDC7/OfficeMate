<?php

namespace App\Enums;

enum InAppNotificationKind: string
{
    case LeaveApproved = 'leave_approved';
    case LeaveRejected = 'leave_rejected';
    case LeaveSubmitted = 'leave_submitted';
}
