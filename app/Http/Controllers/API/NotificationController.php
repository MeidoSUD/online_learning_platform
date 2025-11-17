<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\FirebaseService;

class NotificationController extends Controller
{
    protected $firebaseService;

    public function __construct(FirebaseService $firebaseService)
    {
        $this->firebaseService = $firebaseService;
    }

    public function sendToToken(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'title' => 'required|string',
            'body'  => 'required|string',
        ]);

        $sent = $this->firebaseService->sendToToken(
            $validated['token'],
            $validated['title'],
            $validated['body'],
            $request->input('data', [])
        );

        return response()->json([
            'success' => $sent,
            'message' => $sent ? 'Notification sent successfully' : 'Failed to send notification',
        ]);
    }
}
