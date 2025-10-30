<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;
use App\Models\Orders;

class TeachersApplications extends Model
{
    use HasFactory;
    protected $table = 'teacher_applications';
    protected $fillable = [
        'order_id', 'teacher_id', 'proposed_price', 'message', 'status'
    ];

    protected $casts = [
        'proposed_price' => 'decimal:2',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Orders::class , 'order_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
