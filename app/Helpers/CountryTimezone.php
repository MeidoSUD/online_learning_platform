<?php

namespace App\Helpers;

use Carbon\Carbon;

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
        'LB' => 'Asia/Beirut',
        'SY' => 'Asia/Damascus',
        'IQ' => 'Asia/Baghdad',
        'YE' => 'Asia/Aden',
        'PS' => 'Asia/Gaza',
        'SD' => 'Africa/Khartoum',
        'LY' => 'Africa/Tripoli',
        'TN' => 'Africa/Tunis',
        'DZ' => 'Africa/Algiers',
        'MA' => 'Africa/Casablanca',
        'MR' => 'Africa/Nouakchott',
        'SO' => 'Africa/Mogadishu',
        'DJ' => 'Africa/Djibouti',
        'KM' => 'Indian/Comoro',
        'TR' => 'Europe/Istanbul',
        'US' => 'America/New_York',
        'UK' => 'Europe/London',
        'GB' => 'Europe/London',
        'CA' => 'America/Toronto',
        'FR' => 'Europe/Paris',
        'DE' => 'Europe/Berlin',
        'IT' => 'Europe/Rome',
        'ES' => 'Europe/Madrid',
        'IN' => 'Asia/Kolkata',
        'PK' => 'Asia/Karachi',
        'BD' => 'Asia/Dhaka',
        'MY' => 'Asia/Kuala_Lumpur',
        'ID' => 'Asia/Jakarta',
        'AU' => 'Australia/Sydney',
    ];

    /**
     * Nationality keywords mapped to timezone
     */
    private const NATIONALITY_KEYWORDS = [
        'saudi' => 'Asia/Riyadh',
        'saudian' => 'Asia/Riyadh',
        'سعودي' => 'Asia/Riyadh',
        'egypt' => 'Africa/Cairo',
        'egyptian' => 'Africa/Cairo',
        'مصري' => 'Africa/Cairo',
        'emirati' => 'Asia/Dubai',
        'uae' => 'Asia/Dubai',
        'إماراتي' => 'Asia/Dubai',
        'kuwaiti' => 'Asia/Kuwait',
        'كويتي' => 'Asia/Kuwait',
        'qatari' => 'Asia/Qatar',
        'قطري' => 'Asia/Qatar',
        'bahraini' => 'Asia/Bahrain',
        'بحريني' => 'Asia/Bahrain',
        'omani' => 'Asia/Muscat',
        'عماني' => 'Asia/Muscat',
        'jordanian' => 'Asia/Amman',
        'أردني' => 'Asia/Amman',
        'lebanese' => 'Asia/Beirut',
        'لبناني' => 'Asia/Beirut',
        'syrian' => 'Asia/Damascus',
        'سوري' => 'Asia/Damascus',
        'iraqi' => 'Asia/Baghdad',
        'عراقي' => 'Asia/Baghdad',
        'yemeni' => 'Asia/Aden',
        'يمني' => 'Asia/Aden',
        'palestinian' => 'Asia/Gaza',
        'فلسطيني' => 'Asia/Gaza',
        'sudanese' => 'Africa/Khartoum',
        'سوداني' => 'Africa/Khartoum',
        'tunisian' => 'Africa/Tunis',
        'تونسي' => 'Africa/Tunis',
        'algerian' => 'Africa/Algiers',
        'جزائري' => 'Africa/Algiers',
        'moroccan' => 'Africa/Casablanca',
        'مغربي' => 'Africa/Casablanca',
        'turkish' => 'Europe/Istanbul',
        'تركي' => 'Europe/Istanbul',
        'british' => 'Europe/London',
        'american' => 'America/New_York',
        'indian' => 'Asia/Kolkata',
        'pakistani' => 'Asia/Karachi',
    ];

    /**
     * Resolve timezone name from country key or nationality string
     */
    public static function fromCountry(?string $countryKey, ?string $nationality = null): string
    {
        if ($countryKey) {
            $key = strtoupper(trim($countryKey));
            if (isset(self::TIMEZONES[$key])) {
                return self::TIMEZONES[$key];
            }
        }

        if ($nationality) {
            $natLower = strtolower(trim($nationality));
            if (isset(self::NATIONALITY_KEYWORDS[$natLower])) {
                return self::NATIONALITY_KEYWORDS[$natLower];
            }

            foreach (self::NATIONALITY_KEYWORDS as $keyword => $tz) {
                if (str_contains($natLower, $keyword)) {
                    return $tz;
                }
            }

            foreach (self::TIMEZONES as $country => $timezone) {
                if (strtolower($country) === $natLower) {
                    return $timezone;
                }
            }
        }

        return config('app.timezone', 'Asia/Riyadh');
    }

    /**
     * Common timezone abbreviations mapped to representative IANA timezone
     */
    private const ABBREVIATIONS = [
        'EET' => 'Africa/Cairo',
        'EEST' => 'Africa/Cairo',
        'AST' => 'Asia/Riyadh',
        'GST' => 'Asia/Dubai',
        'CET' => 'Europe/Paris',
        'CEST' => 'Europe/Paris',
        'WET' => 'Europe/London',
        'WEST' => 'Europe/London',
        'GMT' => 'UTC',
        'UTC' => 'UTC',
        'EST' => 'America/New_York',
        'EDT' => 'America/New_York',
        'CST' => 'America/Chicago',
        'CDT' => 'America/Chicago',
        'MST' => 'America/Denver',
        'MDT' => 'America/Denver',
        'PST' => 'America/Los_Angeles',
        'PDT' => 'America/Los_Angeles',
    ];

    /**
     * Standard UTC offset mapping to default IANA timezone
     */
    private const OFFSET_TIMEZONES = [
        '+02:00' => 'Africa/Cairo',
        '+03:00' => 'Asia/Riyadh',
        '+04:00' => 'Asia/Dubai',
        '+01:00' => 'Africa/Algiers',
        '+00:00' => 'UTC',
        '+05:00' => 'Asia/Karachi',
        '+05:30' => 'Asia/Kolkata',
        '-04:00' => 'America/New_York',
        '-05:00' => 'America/New_York',
        '-06:00' => 'America/Chicago',
        '-07:00' => 'America/Denver',
        '-08:00' => 'America/Los_Angeles',
    ];

    /**
     * Resolve valid IANA timezone identifier from any input (IANA, abbreviation, or offset)
     */
    public static function fromInput(?string $timezone, ?string $offset = null, ?string $fallback = null): string
    {
        if ($timezone) {
            $tz = trim($timezone);
            if (self::isValidTimezone($tz)) {
                return $tz;
            }
            $upper = strtoupper($tz);
            if (isset(self::ABBREVIATIONS[$upper])) {
                return self::ABBREVIATIONS[$upper];
            }
        }

        if ($offset) {
            $cleanedOffset = trim($offset);
            // Normalize offset format like +2, +02, +0200 to +02:00
            if (preg_match('/^([+-])(\d{1,2}):?(\d{2})?$/', $cleanedOffset, $m)) {
                $sign = $m[1];
                $hours = str_pad($m[2], 2, '0', STR_PAD_LEFT);
                $minutes = isset($m[3]) ? str_pad($m[3], 2, '0', STR_PAD_LEFT) : '00';
                $cleanedOffset = "{$sign}{$hours}:{$minutes}";
            }

            if (isset(self::OFFSET_TIMEZONES[$cleanedOffset])) {
                return self::OFFSET_TIMEZONES[$cleanedOffset];
            }
        }

        if ($fallback && self::isValidTimezone($fallback)) {
            return $fallback;
        }

        return config('app.timezone', 'Asia/Riyadh');
    }

    /**
     * Convert a weekly recurring time slot between two timezone offsets.
     * Takes care of day rollovers across midnight boundaries.
     *
     * @param string $time e.g. "20:00"
     * @param int $dayNumber 1=Saturday .. 7=Friday
     * @param string $fromOffset e.g. "+02:00"
     * @param string $toOffset e.g. "+03:00"
     * @return array{day: int, start_time: string, end_time: string}
     */
    public static function convertSlotBetweenOffsets(string $time, int $dayNumber, string $fromOffset, string $toOffset): array
    {
        if ($fromOffset === $toOffset) {
            $parsed = Carbon::createFromFormat('H:i', substr($time, 0, 5));
            return [
                'day' => $dayNumber,
                'start_time' => $parsed->format('H:i'),
                'end_time' => $parsed->copy()->addHour()->format('H:i'),
            ];
        }

        // Anchor date: 2026-01-03 is a Saturday (Day 1)
        $baseDate = Carbon::create(2026, 1, 3)->addDays($dayNumber - 1);
        $dt = Carbon::parse($baseDate->format('Y-m-d') . ' ' . substr($time, 0, 5) . ' ' . $fromOffset);
        $dtConverted = $dt->copy()->setTimezone($toOffset);

        // Convert Carbon dayOfWeek (0=Sun..6=Sat) to platform day numbers (1=Sat, 2=Sun, 3=Mon... 7=Fri)
        $carbonDow = $dtConverted->dayOfWeek;
        $newDay = ($carbonDow === 6) ? 1 : ($carbonDow + 2);

        return [
            'day' => $newDay,
            'start_time' => $dtConverted->format('H:i'),
            'end_time' => $dtConverted->copy()->addHour()->format('H:i'),
        ];
    }

    /**
     * Check if a timezone identifier is valid
     */
    public static function isValidTimezone(?string $timezone): bool
    {
        if (!$timezone) {
            return false;
        }

        try {
            return in_array($timezone, \DateTimeZone::listIdentifiers(), true);
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Get the current formatted UTC offset string (e.g. "+03:00", "+02:00", "-05:00")
     * for any timezone identifier, properly respecting Daylight Saving Time.
     */
    public static function getOffset(?string $timezone): string
    {
        $tz = self::isValidTimezone($timezone)
            ? $timezone
            : config('app.timezone', 'Asia/Riyadh');

        try {
            return Carbon::now($tz)->format('P');
        } catch (\Throwable $e) {
            return '+03:00';
        }
    }

    /**
     * Normalize or validate timezone string, falling back to default
     */
    public static function normalizeTimezone(?string $timezone, ?string $fallback = null): string
    {
        if (self::isValidTimezone($timezone)) {
            return $timezone;
        }

        if ($fallback && self::isValidTimezone($fallback)) {
            return $fallback;
        }

        return config('app.timezone', 'Asia/Riyadh');
    }
}

