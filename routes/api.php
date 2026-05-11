<?php

use App\Http\Controllers\Api\DesktopActivityController;
use App\Http\Controllers\Api\DesktopAuthController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [DesktopAuthController::class, 'store'])
    ->middleware('throttle:10,1')
    ->name('api.login');

Route::post('/activity', [DesktopActivityController::class, 'store'])
    ->middleware(['auth:sanctum', 'throttle:120,1'])
    ->name('api.activity');
