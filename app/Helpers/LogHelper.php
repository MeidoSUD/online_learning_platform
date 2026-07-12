<?php

namespace App\Helpers;

use Throwable;
use App\Models\SystemLog;

class LogHelper
{
    public static function exception(Throwable $e, array $context = []): void
    {
        self::save(
            level: 'error',
            title: class_basename($e),
            message: $e->getMessage(),
            file: $e->getFile(),
            line: $e->getLine(),
            trace: $e->getTraceAsString(),
            type: get_class($e),
            context: $context
        );
    }

    public static function error(string $message, array $context = []): void
    {
        self::save(
            level: 'error',
            title: 'Application Error',
            message: $message,
            context: $context
        );
    }

    public static function warning(string $message, array $context = []): void
    {
        self::save(
            level: 'warning',
            title: 'Warning',
            message: $message,
            context: $context
        );
    }

    public static function info(string $message, array $context = []): void
    {
        self::save(
            level: 'info',
            title: 'Info',
            message: $message,
            context: $context
        );
    }

    protected static function save(
        string $level,
        string $title,
        string $message,
        ?string $file = null,
        ?int $line = null,
        ?string $trace = null,
        ?string $type = null,
        array $context = []
    ): void {
        try {
            $normalized = preg_replace('/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/', '<TIMESTAMP>', $message);
            $hash = sha1(
                implode('|', [
                    $level,
                    $type,
                    $normalized,
                    $file,
                    $line,
                ])
            );

            $log = SystemLog::where('hash', $hash)->first();

            if ($log) {
                $log->increment('occurrences');

                $log->update([
                    'last_occurred_at' => now(),
                    'context' => $context,
                ]);

                return;
            }

            SystemLog::create([
                'level' => $level,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'file' => $file,
                'line' => $line,
                'trace' => $trace,
                'url' => request()?->fullUrl(),
                'method' => request()?->method(),
                'ip' => request()?->ip(),
                'user_agent' => request()?->userAgent(),
                'user_id' => auth()->id(),
                'context' => $context,
                'hash' => $hash,
                'occurrences' => 1,
                'last_occurred_at' => now(),
            ]);
        } catch (Throwable) {
            //
        }
    }
}
