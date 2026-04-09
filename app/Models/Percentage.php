<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Percentage extends Model
{
    use HasFactory;
    protected $table = 'percentages';
    protected $fillable = [
        'revenue_percentage',
        'tax_percentage',
    ];


    public static function getCurrentPercentages()
    {
        return self::latest()->first();
    }
}