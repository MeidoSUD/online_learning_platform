<?php

namespace App\Helpers;

class PhoneHelper
{
    /**
     * Normalize phone number to KSA format with country code
     * Handles: 501234567, 0501234567, +966501234567, 966501234567
     * Always returns: +966501234567
     * 
     * @param string $phone
     * @return string|null
     */
    public static function normalize($phone)
    {
        if (empty($phone)) {
            return null;
        }

        // Remove all whitespace and hyphens
        $phone = preg_replace('/[\s\-]/', '', trim($phone));

        // Remove leading zeros or plus signs to get base number
        $phone = ltrim($phone, '0+');

        // Extract the last 9 digits (KSA phone numbers are 9 digits)
        $lastNineDigits = substr($phone, -9);

        // Validate it's actually 9 digits
        if (strlen($lastNineDigits) !== 9 || !ctype_digit($lastNineDigits)) {
            return null;
        }

        // Return with KSA country code
        return '+966' . $lastNineDigits;
    }

    /**
     * Normalize phone number for SMS sending (without +)
     * Returns: 966501234567
     * 
     * @param string $phone
     * @return string|null
     */
    public static function normalizeForSMS($phone)
    {
        $normalized = self::normalize($phone);
        if ($normalized) {
            return ltrim($normalized, '+');
        }
        return null;
    }

    /**
     * Validate if a phone number is in KSA format
     * 
     * @param string $phone
     * @return bool
     */
    public static function isValid($phone)
    {
        return self::normalize($phone) !== null;
    }
}
