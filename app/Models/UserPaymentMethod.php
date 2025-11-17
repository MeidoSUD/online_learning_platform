<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserPaymentMethod extends Model
{
    use HasFactory;
    protected $table = 'user_payment_methods';
    protected $fillable = [
        'user_id',
        'payment_method_id',
        'bank_id',
        'account_number',
        'account_holder_name',
        'iban',
        'swift_code',
        'card_brand',
        'card_number',
        'card_holder_name',
        'card_cvc',
        'card_expiry_month',
        'card_expiry_year',
        'is_default'
    ];

    public function user()
    {
        return $this->belongsTo(User::class , 'user_id');
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class , 'payment_method_id');
    }
    public function banks()
    {
        return $this->belongsTo(Banks::class , 'bank_id');
    }
}
