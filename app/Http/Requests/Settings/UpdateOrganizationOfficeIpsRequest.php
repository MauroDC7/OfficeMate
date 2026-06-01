<?php

namespace App\Http\Requests\Settings;

use App\Support\OfficeIpAddress;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOrganizationOfficeIpsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'office_ip_addresses' => ['present', 'array', 'max:10'],
            'office_ip_addresses.*' => [
                'required',
                'string',
                'max:45',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! is_string($value) || ! OfficeIpAddress::isValid($value)) {
                        $fail('Voer een geldig IP-adres of CIDR-blok in.');
                    }
                },
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'office_ip_addresses.max' => 'Je kunt maximaal 10 kantoor-IP-adressen opslaan.',
        ];
    }
}
