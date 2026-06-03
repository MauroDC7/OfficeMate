<?php

use App\Enums\LeaveType;
use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\LeaveRequestAttachment;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

it('requires a medical certificate when submitting sick leave', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('leaveRequests.store'), [
            'type' => LeaveType::Sick->value,
            'starts_on' => '2026-06-01',
            'ends_on' => '2026-06-02',
        ])
        ->assertSessionHasErrors('medical_certificate');

    expect(LeaveRequest::query()->where('user_id', $user->id)->count())->toBe(0);
});

it('stores sick leave with a medical certificate', function () {
    $user = User::factory()->create();
    $file = UploadedFile::fake()->create('brief.pdf', 100, 'application/pdf');

    $this->actingAs($user)
        ->post(route('leaveRequests.store'), [
            'type' => LeaveType::Sick->value,
            'starts_on' => '2026-06-01',
            'ends_on' => '2026-06-02',
            'medical_certificate' => $file,
        ])
        ->assertRedirect(route('leaveRequests'));

    $leaveRequest = LeaveRequest::query()->where('user_id', $user->id)->sole();
    $attachment = LeaveRequestAttachment::query()->where('leave_request_id', $leaveRequest->id)->sole();

    Storage::disk('local')->assertExists($attachment->path);
    expect($attachment->original_name)->toBe('brief.pdf');
});

it('allows the owner to download a medical certificate', function () {
    $user = User::factory()->create();
    $leaveRequest = LeaveRequest::factory()->for($user)->pending()->sick()->create();
    $path = 'leave-requests/'.$leaveRequest->id.'/brief.pdf';
    Storage::disk('local')->put($path, 'pdf-inhoud');

    LeaveRequestAttachment::factory()->for($leaveRequest)->create([
        'path' => $path,
        'original_name' => 'brief.pdf',
        'mime_type' => 'application/pdf',
    ]);

    $this->actingAs($user)
        ->get(route('leaveRequests.medicalCertificate', $leaveRequest))
        ->assertOk()
        ->assertDownload('brief.pdf');
});

it('allows an admin from the same organization to download a medical certificate', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create();
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);

    $leaveRequest = LeaveRequest::factory()->for($employee)->pending()->sick()->create();
    $path = 'leave-requests/'.$leaveRequest->id.'/brief.pdf';
    Storage::disk('local')->put($path, 'pdf-inhoud');

    LeaveRequestAttachment::factory()->for($leaveRequest)->create([
        'path' => $path,
        'original_name' => 'brief.pdf',
    ]);

    $this->actingAs($admin)
        ->get(route('leaveRequests.medicalCertificate', $leaveRequest))
        ->assertOk();
});

it('removes the medical certificate when sick leave is changed to vacation', function () {
    $user = User::factory()->create();
    $leaveRequest = LeaveRequest::factory()->for($user)->pending()->sick()->create();
    $path = 'leave-requests/'.$leaveRequest->id.'/brief.pdf';
    Storage::disk('local')->put($path, 'pdf-inhoud');

    LeaveRequestAttachment::factory()->for($leaveRequest)->create(['path' => $path]);

    $this->actingAs($user)
        ->patch(route('leaveRequests.update', $leaveRequest), [
            'type' => LeaveType::Vacation->value,
            'starts_on' => $leaveRequest->starts_on->format('Y-m-d'),
            'ends_on' => $leaveRequest->ends_on->format('Y-m-d'),
        ])
        ->assertRedirect(route('leaveRequests'));

    Storage::disk('local')->assertMissing($path);
    expect(LeaveRequestAttachment::query()->where('leave_request_id', $leaveRequest->id)->count())->toBe(0);
});
