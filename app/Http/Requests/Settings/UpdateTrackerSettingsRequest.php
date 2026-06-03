<?php

namespace App\Http\Requests\Settings;

use App\Services\TrackerBlocklistMatcher;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateTrackerSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null
            && $this->user()->organization_id !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'tracker_use_ai_for_proposals' => ['required', 'boolean'],
            'tracker_tracking_enabled' => ['required', 'boolean'],
            'tracker_blocklist' => ['present', 'array', 'max:50'],
            'tracker_blocklist.*' => ['string', 'max:200'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $matcher = app(TrackerBlocklistMatcher::class);

        $this->merge([
            'tracker_use_ai_for_proposals' => $this->boolean('tracker_use_ai_for_proposals'),
            'tracker_tracking_enabled' => $this->boolean('tracker_tracking_enabled'),
            'tracker_blocklist' => $matcher->normalizeBlocklist($this->input('tracker_blocklist', [])),
        ]);
    }

    /**
     * @return array{
     *     tracker_use_ai_for_proposals: bool,
     *     tracker_tracking_enabled: bool,
     *     tracker_blocklist: list<string>
     * }
     */
    public function trackerPreferences(): array
    {
        $validated = $this->validated();

        return [
            'tracker_use_ai_for_proposals' => (bool) $validated['tracker_use_ai_for_proposals'],
            'tracker_tracking_enabled' => (bool) $validated['tracker_tracking_enabled'],
            'tracker_blocklist' => $validated['tracker_blocklist'],
        ];
    }
}
