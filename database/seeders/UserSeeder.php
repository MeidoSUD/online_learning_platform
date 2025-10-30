<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\File;
use Illuminate\Support\Facades\Storage;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $rand = rand(1111,9999);

        $colors_arr = ['#0F2C67','#CD1818','#F3950D','#116530','#FFCC1D'];

        $img = \DefaultProfileImage::create("administrator", 256, $colors_arr[array_rand($colors_arr)], '#FFF');
        $save_image = \Storage::disk('public_file')->put("profile_photos/".$rand."profile.png", $img->encode());

        $user = new User();
        $user->name = 'admin';
        $user->email = 'admin@laravel.com';
        $user->password = Hash::make('123456789');
        $user->phone = '0123456789';
        $user->user_type_id = 1;
        $user->is_active = 1;
        $user->profile_pic = 'files/profile_photos/'.$rand.'profile.png';
        $user->save();
    }
}
