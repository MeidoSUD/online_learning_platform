<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserCeretifacte extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'certificate_name',
        'institution',
        'date_obtained',
        'certificate_file',
    ];
}
