<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\HyperpayService;
use App\Models\Payment;
use App\Models\PaymentMethod;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;

class PaymentMethodController extends Controller
{

    public function index()
    {
        $paymentMethods = PaymentMethod::all();
        return response()->json([
            'success' => true,
            'data' => $paymentMethods
        ]);
    }

}
