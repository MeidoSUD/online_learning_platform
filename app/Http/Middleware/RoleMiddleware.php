<?php
// app/Http/Middleware/RoleMiddleware.php
namespace App\Http\Middleware;

use App\Models\Role;
use Closure;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    public function handle($request, Closure $next, $role)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('login');
        }

        // Get the role from the database by name
        $roleModel = Role::where('name_key', $role)->first();

        if ($roleModel && $user->role_id == $roleModel->id) {
            return $next($request);
        }

        abort(403);
    }
}