<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class FCMTokenController extends Controller
{
    public function save(Request $request)
    {
        $request->validate(['token' => 'required|string']);

        $user = $request->user();
        $user->update(['fcm_token' => $request->token]);

        return response()->json(['message' => app()->getLocale() === 'ar' ? 'تم حفظ الرمز بنجاح' : 'Token saved successfully']);
    }
}
