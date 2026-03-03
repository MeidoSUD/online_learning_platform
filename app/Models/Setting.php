<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'description',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function scopeByGroup($query, string $group)
    {
        return $query->where('group', $group);
    }

    public static function getByKey(string $key): ?self
    {
        return static::where('key', $key)->first();
    }

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $setting = static::getByKey($key);
        if (!$setting) {
            return $default;
        }

        return match ($setting->type) {
            'bool' => (bool) $setting->value,
            'number', 'int', 'integer' => (int) $setting->value,
            'float', 'double' => (float) $setting->value,
            'json' => json_decode($setting->value, true),
            default => $setting->value,
        };
    }

    public static function setValue(string $key, mixed $value, string $type = 'string', string $group = 'general', ?string $description = null): self
    {
        $value = match ($type) {
            'bool' => $value ? '1' : '0',
            'array', 'json' => json_encode($value),
            default => $value,
        };

        return static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'type' => $type,
                'group' => $group,
                'description' => $description,
            ]
        );
    }
}
