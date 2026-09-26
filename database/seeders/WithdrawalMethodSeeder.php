<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class WithdrawalMethodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        \App\Models\WithdrawalMethod::firstOrCreate(
            ['key' => 'bank_account'],
            [
                'name_ar' => 'حساب بنكي',
                'name_en' => 'Bank Account',
                'is_active' => true,
            ]
        );

        \App\Models\WithdrawalMethod::firstOrCreate(
            ['key' => 'card'],
            [
                'name_ar' => 'بطاقة',
                'name_en' => 'Card',
                'is_active' => true,
            ]
        );
    }
}
