<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserHiddenService extends Model
{
    use HasFactory;

    protected $table = 'user_hidden_services';

    protected $fillable = [
        'user_id',
        'service_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function service()
    {
        return $this->belongsTo(Services::class, 'service_id');
    }
}
