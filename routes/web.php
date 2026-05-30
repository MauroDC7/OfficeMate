<?php

use App\Http\Controllers\AppPageController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\LegalController;
use App\Http\Controllers\OrganizationInviteAcceptController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectCreatorAccessController;
use App\Http\Controllers\Settings\AccountSettingsController;
use App\Http\Controllers\Settings\OrganizationInviteController;
use App\Http\Controllers\Settings\OrganizationSettingsController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TeamMembershipController;
use App\Http\Controllers\TimesheetEntryController;
use App\Http\Controllers\TimesheetEntryProposalController;
use App\Http\Controllers\TimesheetTrackerWindowTitlesController;
use Illuminate\Support\Facades\Route;

Route::get('/email/verify', [VerifyEmailController::class, 'notice'])->name('verification.notice');

Route::get('/email/verify/{id}/{hash}', [VerifyEmailController::class, 'verify'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');

Route::middleware('auth')->group(function (): void {
    Route::post('/email/verification-notification', [VerifyEmailController::class, 'resend'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');
});

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::get('/', [AppPageController::class, 'dashboard'])->name('dashboard');
    Route::get('/timesheets', [AppPageController::class, 'timesheets'])->name('timesheets');
    Route::get('/timesheets/tracker-window-titles', TimesheetTrackerWindowTitlesController::class)
        ->name('timesheets.tracker-window-titles');
    Route::post('/timesheets/entries', [TimesheetEntryController::class, 'store'])->name('timesheets.entries.store');
    Route::patch('/timesheets/entries/{timesheet_entry}', [TimesheetEntryController::class, 'update'])->name('timesheets.entries.update');
    Route::delete('/timesheets/entries/{timesheet_entry}', [TimesheetEntryController::class, 'destroy'])->name('timesheets.entries.destroy');
    Route::post('/timesheets/proposals', [TimesheetEntryProposalController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('timesheets.proposals.store');
    Route::patch('/timesheets/proposals/{timesheet_entry_proposal}', [TimesheetEntryProposalController::class, 'update'])->name('timesheets.proposals.update');
    Route::post('/timesheets/proposals/{timesheet_entry_proposal}/approve', [TimesheetEntryProposalController::class, 'approve'])->name('timesheets.proposals.approve');
    Route::delete('/timesheets/proposals/{timesheet_entry_proposal}', [TimesheetEntryProposalController::class, 'destroy'])->name('timesheets.proposals.destroy');
    Route::get('/projects', [ProjectController::class, 'index'])->name('projects');
    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::patch('/projects/{project}', [ProjectController::class, 'update'])->name('projects.update');
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');
    Route::patch('/projects/creator-access/{user}', [ProjectCreatorAccessController::class, 'update'])
        ->middleware('admin')
        ->name('projects.creator-access.update');
    Route::get('/leave-requests', [AppPageController::class, 'leaveRequests'])->name('leaveRequests');
    Route::get('/admin/leave-requests', [AppPageController::class, 'adminLeaveRequests'])
        ->middleware('admin')
        ->name('admin.leaveRequests');
    Route::post('/leave-requests', [LeaveRequestController::class, 'store'])->name('leaveRequests.store');
    Route::post('/leave-requests/bulk-approve', [LeaveRequestController::class, 'bulkApprove'])
        ->middleware('admin')
        ->name('leaveRequests.bulkApprove');
    Route::patch('/leave-requests/{leave_request}', [LeaveRequestController::class, 'update'])
        ->name('leaveRequests.update');
    Route::delete('/leave-requests/{leave_request}', [LeaveRequestController::class, 'destroy'])
        ->name('leaveRequests.destroy');
    Route::get('/leave-requests/{leave_request}/medical-certificate', [LeaveRequestController::class, 'medicalCertificate'])
        ->name('leaveRequests.medicalCertificate');
    Route::post('/leave-requests/{leave_request}/approve', [LeaveRequestController::class, 'approve'])
        ->middleware('admin')
        ->name('leaveRequests.approve');
    Route::post('/leave-requests/{leave_request}/reject', [LeaveRequestController::class, 'reject'])
        ->middleware('admin')
        ->name('leaveRequests.reject');
    Route::get('/settings', [AppPageController::class, 'settings'])->name('settings');
    Route::patch('/settings/account', AccountSettingsController::class)->name('settings.account.update');
    Route::get('/teams', [TeamController::class, 'index'])->name('teams');
    Route::patch('/teams/organization/{organization}', OrganizationSettingsController::class)
        ->middleware('admin')
        ->name('teams.organization.update');
    Route::post('/teams/organization-invites', [OrganizationInviteController::class, 'store'])
        ->middleware(['admin', 'throttle:10,1'])
        ->name('teams.organization-invites.store');
    Route::post('/teams', [TeamController::class, 'store'])->middleware('admin')->name('teams.store');
    Route::patch('/teams/{team}', [TeamController::class, 'update'])->middleware('admin')->name('teams.update');
    Route::delete('/teams/{team}', [TeamController::class, 'destroy'])->middleware('admin')->name('teams.destroy');
    Route::post('/teams/{team}/join', [TeamMembershipController::class, 'store'])->name('teams.join');
    Route::post('/team-memberships/{team_membership}/approve', [TeamMembershipController::class, 'approve'])
        ->middleware('admin')
        ->name('team-memberships.approve');
    Route::post('/team-memberships/{team_membership}/reject', [TeamMembershipController::class, 'reject'])
        ->middleware('admin')
        ->name('team-memberships.reject');
    Route::delete('/team-memberships/{team_membership}', [TeamMembershipController::class, 'destroy'])
        ->name('team-memberships.destroy');
});

Route::get('/uitnodiging/{token}', OrganizationInviteAcceptController::class)
    ->name('organization-invite.show');

Route::get('/privacybeleid', [LegalController::class, 'privacy'])->name('privacy');
Route::get('/over-timetraq', [LegalController::class, 'aboutTimeTraq'])->name('about');

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);

    Route::get('/forgot-password', [ForgotPasswordController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [ForgotPasswordController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('password.email');
    Route::get('/reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('/reset-password', [NewPasswordController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('password.update');

    Route::middleware('throttle:10,1')->group(function (): void {
        Route::match(['get', 'post'], '/auth/google/redirect', [GoogleAuthController::class, 'redirect'])
            ->name('auth.google.redirect');
        Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])
            ->name('auth.google.callback');
    });
});
