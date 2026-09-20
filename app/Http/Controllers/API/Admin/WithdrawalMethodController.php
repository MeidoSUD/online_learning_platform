<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalMethod;
use Illuminate\Http\Request;

class WithdrawalMethodController extends Controller
{
    public function index()
    {
        $methods = WithdrawalMethod::all();
        return response()->json([
            'status' => 'success',
            'data' => $methods
        ]);
    }

    public function toggle(Request $request, $id)
    {
        $method = WithdrawalMethod::findOrFail($id);
        $method->is_active = !$method->is_active;
        $method->save();

        return response()->json([
            'status' => 'success',
            'message' => 'تم التحديث بنجاح',
            'data' => $method
        ]);
    }
}
