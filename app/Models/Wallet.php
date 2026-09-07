<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;

class Wallet extends Model
{
    use HasFactory;
    protected $fillable = ['user_id', 'balance', 'pending_balance'];

    /**
     * Get the wallet for a user, creating it if it does not exist yet.
     *
     * Concurrency-safe: the unique users.user_id index rejects a second INSERT
     * when two requests race, and we re-fetch the winning row instead of
     * throwing a duplicate-entry violation.
     */
    public static function getOrCreateForUser(int $userId): self
    {
        $attempts = 0;

        while (true) {
            $wallet = static::where('user_id', $userId)->first();

            if ($wallet) {
                return $wallet;
            }

            try {
                return static::create([
                    'user_id' => $userId,
                    'balance' => 0,
                    'pending_balance' => 0,
                ]);
            } catch (QueryException $e) {
                if ((int) (($e->errorInfo[1] ?? null) ?? 0) !== 1062) {
                    throw $e;
                }

                if (++$attempts >= 3) {
                    throw $e;
                }
            }
        }
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function credit($amount, $description = '', $meta = [])
    {
        $balanceBefore = $this->balance;
        $this->balance += $amount;
        $this->save();

        return $this->transactions()->create([
            'type' => 'credit',
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $this->balance,
            'description' => $description,
            'meta' => $meta
        ]);
    }

    public function debit($amount, $description = '', $meta = [])
    {
        if ($this->balance < $amount) {
            throw new \Exception("Insufficient balance");
        }

        $balanceBefore = $this->balance;
        $this->balance -= $amount;
        $this->save();

        return $this->transactions()->create([
            'type' => 'debit',
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $this->balance,
            'description' => $description,
            'meta' => $meta
        ]);
    }
}
