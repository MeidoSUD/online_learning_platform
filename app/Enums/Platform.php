<?php

declare(strict_types=1);

namespace App\Enums;

enum Platform: string
{
    case Android = 'android';
    case IOS = 'ios';
    case Web = 'web';
    case Other = 'other';
}
