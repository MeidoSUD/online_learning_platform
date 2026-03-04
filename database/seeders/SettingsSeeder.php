<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $settings = [
            [
                'key' => 'app_name',
                'value' =>'ewan',
                'type' => 'string',
                'group' => 'app',
                'description' => 'Application name',
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'key' => 'maintenance_enabled',
                'value' => '0',
                'type' => 'bool',
                'group' => 'app',
                'description' => 'Enable/disable maintenance mode',
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'key' => 'app_version_ios',
                'value' => '1.0.0',
                'type' => 'string',
                'group' => 'app',
                'description' => 'Mobile ios version',
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'key' => 'app_version_android',
                'value' => '1.0.0',
                'type' => 'string',
                'group' => 'app',
                'description' => 'Mobile android version',
                'created_at' => $now,
                'updated_at' => $now
            ],   [
                'key' => 'force_update_android',
                'value' => '0',
                'type' => 'bool',
                'group' => 'app',
                'description' => 'Force update android app',
                'created_at' => $now,
                'updated_at' => $now
            ],
             [
                'key' => 'force_update_ios',
                'value' => '0',
                'type' => 'bool',
                'group' => 'app',
                'description' => 'Force update ios app',
                'created_at' => $now,
                'updated_at' => $now
            ],
         
           
            [
                'key' => 'terms_and_conditions',
                'value' => 'Terms and conditions text goes here...',
                'type' => 'textarea',
                'group' => 'app',
                'description' => 'Terms and conditions for the application',
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'key' => 'default_language',
                'value' => 'ar',
                'type' => 'select',
                'group' => 'app',
                'description' => 'Default application language',
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'key' => 'support_email',
                'value' => 'ewan@app.com',
                'type' => 'string',
                'group' => 'contact',
                'description' => 'Support email address',
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'key' => 'support_phone',
                'value' => '+96655',
                'type' => 'string',
                'group' => 'contact',
                'description' => 'Support phone number',
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'key' => 'allow_registration',
                'value' => '1',
                'type' => 'bool',
                'group' => 'app',
                'description' => 'Allow new user registration',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'currency',
                'value' => 'RSA',
                'type' => 'select',
                'group' => 'app',
                'description' => 'Default currency',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ];

        DB::table('settings')->upsert(
            $settings,
            ['key'],
            ['value', 'type', 'group', 'description', 'updated_at']
        );
    }
}
