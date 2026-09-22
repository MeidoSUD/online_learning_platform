<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SendMarketingNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Normalize empty strings (e.g. blank datetime-local inputs, unset user)
     * to null before validation so the nullable rules behave correctly.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'target_user_id' => filled($this->input('target_user_id')) ? $this->input('target_user_id') : null,
            'scheduled_at' => $this->normalizeScheduledAt($this->input('scheduled_at')),
            'target_user_ids' => $this->normalizeUserIds($this->input('target_user_ids')),
        ]);
    }

    /**
     * Blank or past dates mean "send now". Only a genuine future timestamp is
     * kept as a schedule, so picking a time before "now" never fails with a
     * 422 — it is treated as an immediate send instead.
     */
    private function normalizeScheduledAt(mixed $value): ?string
    {
        if (! filled($value)) {
            return null;
        }

        try {
            $parsed = Carbon::parse($value);
        } catch (\Throwable) {
            return (string) $value; // let the date rule surface an invalid format
        }

        return $parsed->gt(now()) ? (string) $parsed : null;
    }

    /** Accepts an array of ids (JSON) or a comma-separated list (query string). */
    private function normalizeUserIds(mixed $value): array
    {
        if (empty($value) && $value !== []) {
            return [];
        }

        $ids = is_string($value) ? explode(',', $value) : (array) $value;

        return array_values(array_unique(
            array_filter(array_map('intval', $ids), fn (int $id) => $id > 0)
        ));
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'],
            'body' => ['required', 'string', 'max:1000'],
            'channel' => ['required', Rule::in(['push', 'sms', 'email', 'both', 'all'])],
            'target_type' => ['required', Rule::in(['all', 'teachers', 'students', 'single_user', 'multi_teachers', 'multi_students'])],
            'target_user_id' => [
                'nullable', 'integer', 'required_if:target_type,single_user', 'exists:users,id',
            ],
            'target_user_ids' => [
                'nullable', 'array',
                'required_if:target_type,multi_teachers', 'required_if:target_type,multi_students',
            ],
            'target_user_ids.*' => ['integer', 'exists:users,id'],
            'scheduled_at' => ['nullable', 'date'],
        ];
    }

    /**
     * A 422 is thrown before the controller runs, so without this override
     * validation failures never reach the log. Record the real reason here.
     */
    protected function failedValidation(Validator $validator): void
    {
        Log::warning('Marketing notification send rejected (422)', [
            'admin_id' => $this->user()?->id,
            'channel' => $this->input('channel'),
            'target_type' => $this->input('target_type'),
            'target_user_id' => $this->input('target_user_id'),
            'scheduled_at' => $this->input('scheduled_at'),
            'title_length' => mb_strlen((string) $this->input('title')),
            'body_length' => mb_strlen((string) $this->input('body')),
            'errors' => $validator->errors()->toArray(),
        ]);

        throw new ValidationException($validator);
    }
}