<?php

namespace App\Helpers;

class CountryTimezone
{
    private const TIMEZONES = [
        'SA' => 'Asia/Riyadh',
        'AE' => 'Asia/Dubai',
        'EG' => 'Africa/Cairo',
        'KW' => 'Asia/Kuwait',
        'QA' => 'Asia/Qatar',
        'BH' => 'Asia/Bahrain',
        'OM' => 'Asia/Muscat',
        'JO' => 'Asia/Amman',
        'US' => 'America/New_York',
        'UK' => 'Europe/London',
    ];

    public static function fromCountry(?string $countryKey, ?string $nationality = null): string
    {
        $key = strtoupper(trim((string) $countryKey));

        if (isset(self::TIMEZONES[$key])) {
            return self::TIMEZONES[$key];
        }

        $nationality = strtolower(trim((string) $nationality));
        foreach (self::TIMEZONES as $country => $timezone) {
            if (strtolower($country) === $nationality) {
                return $timezone;
            }
        }

        return config('app.timezone', 'Asia/Riyadh');
    }
}
