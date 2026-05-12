<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AppPageController extends Controller
{
    public function dashboard(Request $request): Response
    {
        $user = $request->user();

        if ($user !== null && $user->role === UserRole::Admin) {
            return Inertia::render('admin/dashboard');
        }

        return Inertia::render('dashboard');
    }

    public function timesheets(): Response
    {
        return Inertia::render('timesheets');
    }

    public function projects(): Response
    {
        return Inertia::render('projects');
    }

    public function leaveRequests(): Response
    {
        return Inertia::render('leaveRequests');
    }

    public function shiftPlanning(): Response
    {
        return Inertia::render('shiftPlanning');
    }

    public function settings(): Response
    {
        return Inertia::render('settings');
    }
}
