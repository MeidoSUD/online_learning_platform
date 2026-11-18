<?php

namespace Database\Seeders;

use App\Models\SessionsPackages;
use Illuminate\Database\Seeder;

class TakafulPackageSeeder extends Seeder
{
    public function run(): void
    {
        SessionsPackages::updateOrCreate(
            ['name_ar' => 'تكافل'],
            [
                'name_en' => 'Takaful',
                'description_ar' => 'باقة تكافل',
                'description_en' => 'Takaful Package',
                'sessions_count' => 10,
                'price' => 0.00,
                'type' => 'free',
                'discount_percentage' => 0,
                'is_active' => true,
            ]
        );
    }
}
