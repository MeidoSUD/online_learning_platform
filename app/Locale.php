<?php
if (!function_exists('locale_route')) {
    function locale_route($name, $parameters = [], $absolute = true)
    {
        $parameters = array_merge(['locale' => app()->getLocale()], $parameters);
        return route($name, $parameters, $absolute);
    }
}