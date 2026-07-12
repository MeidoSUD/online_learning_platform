<?php

namespace App\Logging;

use Monolog\Handler\AbstractProcessingHandler;

class DatabaseLogHandler extends AbstractProcessingHandler
{
    protected function write(array $record): void
    {
        try {
            $level = strtolower($record['level_name']);
            $context = $record['context'] ?? [];
            $message = $record['message'];

            $exception = $context['exception'] ?? null;
            unset($context['exception']);

            if ($exception instanceof \Throwable) {
                \App\Helpers\LogHelper::exception($exception, $context);
                return;
            }

            switch ($level) {
                case 'emergency':
                case 'alert':
                case 'critical':
                case 'error':
                    \App\Helpers\LogHelper::error($message, $context);
                    break;
                case 'warning':
                    \App\Helpers\LogHelper::warning($message, $context);
                    break;
                default:
                    \App\Helpers\LogHelper::info($message, $context);
                    break;
            }
        } catch (\Throwable) {
        }
    }
}
