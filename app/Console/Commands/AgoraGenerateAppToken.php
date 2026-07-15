<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use App\Services\AgoraService;

class AgoraGenerateAppToken extends Command
{
    protected $signature = 'agora:generate-app-token {--save : Save the generated token to .env as AGORA_CHAT_APP_TOKEN} {--expire=86400 : Token TTL in seconds}';

    protected $description = 'Generate an Agora Chat App Token using app_id and app_certificate and optionally save it to .env';

    public function handle()
    {
        $expire = (int)$this->option('expire');
        $service = new AgoraService();
        $token = $service->generateAppToken($expire);

        if (! $token) {
            $this->error('Failed to generate Agora App Token. Ensure AGORA_APP_ID and AGORA_APP_CERTIFICATE are set in .env');
            return 1;
        }

        $this->info('Generated Agora App Token (prefix): ' . substr($token, 0, 40) . '...');
        $this->line('Full token:' . PHP_EOL . $token);

        if ($this->option('save')) {
            $envPath = base_path('.env');
            if (! file_exists($envPath)) {
                $this->error('.env file not found at ' . $envPath);
                return 1;
            }
            $contents = file_get_contents($envPath);
            // replace if exists
            if (strpos($contents, 'AGORA_CHAT_APP_TOKEN=') !== false) {
                $contents = preg_replace('/AGORA_CHAT_APP_TOKEN=.*/', 'AGORA_CHAT_APP_TOKEN=' . $token, $contents);
            } else {
                $contents .= PHP_EOL . 'AGORA_CHAT_APP_TOKEN=' . $token . PHP_EOL;
            }
            file_put_contents($envPath, $contents);
            $this->info('Saved AGORA_CHAT_APP_TOKEN to .env');
        }

        return 0;
    }
}
