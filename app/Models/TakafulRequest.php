<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TakafulRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'identity_proof_file',
        'death_certificate_file',
        'status',
        'rejection_reason',
    ];

    protected $appends = [
        'identity_proof_url',
        'death_certificate_url',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function getIdentityProofUrlAttribute(): ?string
    {
        if (!$this->identity_proof_file) {
            return null;
        }

        if (filter_var($this->identity_proof_file, FILTER_VALIDATE_URL)) {
            return $this->identity_proof_file;
        }

        return url('storage/' . ltrim($this->identity_proof_file, '/'));
    }

    public function getDeathCertificateUrlAttribute(): ?string
    {
        if (!$this->death_certificate_file) {
            return null;
        }

        if (filter_var($this->death_certificate_file, FILTER_VALIDATE_URL)) {
            return $this->death_certificate_file;
        }

        return url('storage/' . ltrim($this->death_certificate_file, '/'));
    }
}
