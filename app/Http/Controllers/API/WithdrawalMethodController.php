<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalMethod;
use Illuminate\Http\Request;

class WithdrawalMethodController extends Controller
{
    public function index()
    {
        $methods = WithdrawalMethod::where('is_active', true)->get();
        return response()->json([
            'status' => 'success',
            'data' => $methods
        ]);
    }
}
