<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Wallet extends Model
{
    use HasFactory;
    protected $fillable = ['user_id', 'balance'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function credit($amount, $reason = '', $meta = [])
    {
        $this->balance += $amount;
        $this->save();

        return $this->transactions()->create([
            'type' => 'credit',
            'amount' => $amount,
            'reason' => $reason,
            'meta' => $meta
        ]);
    }

    public function debit($amount, $reason = '', $meta = [])
    {
        if ($this->balance < $amount) {
            throw new \Exception("Insufficient balance");
        }

        $this->balance -= $amount;
        $this->save();

        return $this->transactions()->create([
            'type' => 'debit',
            'amount' => $amount,
            'reason' => $reason,
            'meta' => $meta
        ]);
    }
}

