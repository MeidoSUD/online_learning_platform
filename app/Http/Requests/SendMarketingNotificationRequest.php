<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendMarketingNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'],
            'body' => ['required', 'string', 'max:1000'],
            'channel' => ['required', Rule::in(['push', 'sms', 'both'])],
            'target_type' => ['required', Rule::in(['all', 'teachers', 'students', 'single_user'])],
            'target_user_id' => [
                'nullable', 'integer', 'required_if:target_type,single_user', 'exists:users,id',
            ],
            'scheduled_at' => ['nullable', 'date', 'after:now'],
        ];
    }
}
