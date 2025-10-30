<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ZoomService
{
    /**
     * Create meeting for hostIdentifier (zoom account id or email)
     * Return array with keys: id, join_url, start_url
     */
    public function createMeeting($hostIdentifier, array $meetingData): ?array
    {
        // implement using MacsiDigital Zoom package or direct API
        try {
            // Example using MacsiDigital facade:
            $user = \MacsiDigital\Zoom\Facades\Zoom::user()->find($hostIdentifier) ?? \MacsiDigital\Zoom\Facades\Zoom::user()->first();
            $meeting = $user->meetings()->create($meetingData);
            return [
                'id' => $meeting->id,
                'join_url' => $meeting->join_url,
                'start_url' => $meeting->start_url,
            ];
        } catch (\Exception $e) {
            Log::error('ZoomService createMeeting error: '.$e->getMessage(), ['host' => $hostIdentifier, 'data' => $meetingData]);
            return null;
        }
    }
}