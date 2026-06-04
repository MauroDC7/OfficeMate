<?php

namespace App\Http\Requests\Concerns;

trait TimesheetEntryValidationMessages
{
    /**
     * @return array<string, string>
     */
    protected function timesheetEntryValidationMessages(): array
    {
        return [
            'title.required' => 'Titel is verplicht.',
            'title.max' => 'Titel mag maximaal 255 tekens bevatten.',
            'description.max' => 'Omschrijving mag maximaal 10.000 tekens bevatten.',
            'color.required' => 'Kies een kleur.',
            'color.regex' => 'Kies een geldige kleur (bijv. #FF5500).',
            'worked_on.required' => 'Datum is verplicht.',
            'worked_on.date' => 'Vul een geldige datum in.',
            'worked_on.before_or_equal' => 'De datum mag niet in de toekomst liggen.',
            'start_minutes.required' => 'Starttijd is verplicht.',
            'start_minutes.integer' => 'Starttijd is ongeldig.',
            'start_minutes.min' => 'Starttijd is ongeldig.',
            'start_minutes.max' => 'Starttijd is ongeldig.',
            'end_minutes.required' => 'Eindtijd is verplicht.',
            'end_minutes.integer' => 'Eindtijd is ongeldig.',
            'end_minutes.min' => 'Eindtijd is ongeldig.',
            'end_minutes.max' => 'Eindtijd is ongeldig.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return $this->timesheetEntryValidationMessages();
    }
}
