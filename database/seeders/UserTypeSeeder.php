<?php

namespace Database\Seeders;

use App\Models\UserType;
use Illuminate\Database\Seeder;

class UserTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $types = ['admin', 'lawyer'];

        foreach ($types as $type) {
            $new_type = new UserType();
            $new_type->user_type_desc = $type;
            $new_type->save();
        }
    }
}
