<?php

namespace App\Traits;

use App\Models\Favorite;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\AbstractPaginator;
use Illuminate\Support\Collection;

trait Favoriter
{
    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class, 'user_id');
    }

    public function favorite(Model $target): Favorite
    {
        return $this->favorites()->firstOrCreate([
            'favoriteable_id' => $target->getKey(),
            'favoriteable_type' => get_class($target),
        ]);
    }

    public function unfavorite(Model $target): bool
    {
        return (bool) $this->favorites()
            ->where('favoriteable_id', $target->getKey())
            ->where('favoriteable_type', get_class($target))
            ->delete();
    }

    public function toggleFavorite(Model $target): Favorite|bool
    {
        return $this->hasFavorited($target)
            ? $this->unfavorite($target)
            : $this->favorite($target);
    }

    public function hasFavorited(Model $target): bool
    {
        return $this->favorites()
            ->where('favoriteable_id', $target->getKey())
            ->where('favoriteable_type', get_class($target))
            ->exists();
    }

    public function getFavoriteItems(string $modelClass): Builder
    {
        $model = new $modelClass;
        $table = $model->getTable();
        $keyName = $model->getKeyName();

        return $modelClass::whereIn("{$table}.{$keyName}", function ($query) use ($modelClass) {
            $query->select('favoriteable_id')
                ->from('favorites')
                ->where('favoriteable_type', $modelClass)
                ->where('user_id', $this->getKey());
        });
    }

    public function attachFavoriteStatus($items): mixed
    {
        if ($items instanceof Model) {
            $items->has_favorited = $this->hasFavorited($items);
            return $items;
        }

        $items = $items instanceof Collection ? $items : collect($items);

        if ($items->isEmpty()) {
            return $items;
        }

        $firstItem = $items->first();
        $modelClass = get_class($firstItem);
        $ids = $items->pluck($firstItem->getKeyName())->toArray();

        $favoritedIds = $this->favorites()
            ->where('favoriteable_type', $modelClass)
            ->whereIn('favoriteable_id', $ids)
            ->pluck('favoriteable_id')
            ->toArray();

        foreach ($items as $item) {
            $item->has_favorited = in_array($item->getKey(), $favoritedIds);
        }

        return $items;
    }
}
