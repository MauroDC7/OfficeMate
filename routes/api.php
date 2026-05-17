<?php

use App\Http\Controllers\Api\DesktopActivityController;
use App\Http\Controllers\Api\DesktopAuthController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:5,1')
    ->post('/login', [DesktopAuthController::class, 'login'])
    ->name('api.login');

Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function (): void {
    Route::post('/activity', [DesktopActivityController::class, 'store'])->name('api.activity.store');
});
