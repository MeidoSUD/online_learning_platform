<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dispute extends Model
{
    use HasFactory;
    protected $fillable = [
        'booking_id',
        'payment_id',
        'raised_by', // user_id who raised the dispute
        'against_user_id',   // user_id against whom the dispute is raised
        'reason',
        'resolution_note',
        'status',
    ];
    public function booking()
    {
        return $this->belongsTo(\App\Models\Booking::class, 'booking_id');
    }

    public function payment()
    {
        return $this->belongsTo(\App\Models\Payment::class, 'payment_id');
    }
}