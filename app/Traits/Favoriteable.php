<?php

namespace App\Traits;

use App\Models\Favorite;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

trait Favoriteable
{
    public function favorites(): MorphMany
    {
        return $this->morphMany(Favorite::class, 'favoriteable');
    }

    public function favoriters(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'favorites',
            'favoriteable_id',
            'user_id'
        )->where('favoriteable_type', static::class);
    }

    public function hasBeenFavoritedBy(User $user): bool
    {
        return $this->favoriters()->where('user_id', $user->getKey())->exists();
    }

    public function isFavoritedBy(User $user): bool
    {
        return $this->hasBeenFavoritedBy($user);
    }
}
