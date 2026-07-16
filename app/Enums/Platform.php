<?php

declare(strict_types=1);

namespace App\Enums;

final class Platform
{
    public const ANDROID = 'android';
    public const IOS = 'ios';
    public const WEB = 'web';
    public const OTHER = 'other';

    /**
     * Return all possible values.
     *
     * @return string[]
     */
    public static function values(): array
    {
        return [
            self::ANDROID,
            self::IOS,
            self::WEB,
            self::OTHER,
        ];
    }
}
