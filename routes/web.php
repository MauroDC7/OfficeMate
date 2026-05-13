<?php

use App\Http\Controllers\AppPageController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Settings\AccountSettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function (): void {
    Route::get('/', [AppPageController::class, 'dashboard'])->name('dashboard');
    Route::get('/timesheets', [AppPageController::class, 'timesheets'])->name('timesheets');
    Route::get('/projects', [AppPageController::class, 'projects'])->name('projects');
    Route::get('/leave-requests', [AppPageController::class, 'leaveRequests'])->name('leaveRequests');
    Route::get('/shift-planning', [AppPageController::class, 'shiftPlanning'])->name('shiftPlanning');
    Route::get('/settings', [AppPageController::class, 'settings'])->name('settings');
    Route::patch('/settings/account', AccountSettingsController::class)->name('settings.account.update');

    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');
});

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);
});
