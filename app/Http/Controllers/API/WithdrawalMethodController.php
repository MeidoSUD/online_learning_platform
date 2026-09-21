<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalMethod;
use Illuminate\Http\Request;

class WithdrawalMethodController extends Controller
{
    public function index()
    {
        // نرجع كل الطرق (المفعلة وغير المفعلة) حتى يعرض التطبيق
        // الطرق غير المفعلة بحالة "غير متاح" بدل إخفائها نهائياً.
        $methods = WithdrawalMethod::orderBy('id')->get();
        return response()->json([
            'status' => 'success',
            'data' => $methods
        ]);
    }
}
