<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendMarketingNotificationRequest;
use App\Jobs\SendMarketingNotificationJob;
use App\Models\MarketingNotification;
use App\Models\User;
use App\Services\MarketingNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MarketingNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $campaigns = MarketingNotification::query()->with('targetUser:id,first_name,last_name')
            ->latest()->paginate($request->integer('per_page', 15));

        return response()->json(['success' => true, 'data' => $campaigns]);
    }

    public function send(SendMarketingNotificationRequest $request, MarketingNotificationService $service): JsonResponse
    {
        try {
            $campaign = DB::transaction(function () use ($request, $service) {
                $campaign = MarketingNotification::create($request->validated());
                $campaign->update(['total_targeted' => $service->recipientCount($campaign)]);
                return $campaign->fresh();
            });
        } catch (\Throwable $exception) {
            Log::error('Marketing notification send failed', [
                'admin_id' => $request->user()?->id,
                'payload' => $request->validated(),
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to queue marketing notification',
                'error' => $exception->getMessage(),
            ], 500);
        }

        if ($campaign->scheduled_at) {
            SendMarketingNotificationJob::dispatch($campaign->id)->delay($campaign->scheduled_at);

            Log::info('Marketing notification scheduled', [
                'campaign_id' => $campaign->id,
                'scheduled_at' => $campaign->scheduled_at,
                'admin_id' => $request->user()?->id,
            ]);

            $message = 'Marketing notification scheduled successfully.';
        } else {
            // "Send now": run synchronously (same Dreams.sa request as the
            // register verification SMS) so delivery happens immediately.
            SendMarketingNotificationJob::dispatchSync($campaign->id);
            $campaign->refresh();

            Log::info('Marketing notification sent immediately', [
                'campaign_id' => $campaign->id,
                'channel' => $campaign->channel,
                'total_recipients' => $campaign->total_targeted,
                'total_sent' => $campaign->total_sent,
                'status' => $campaign->status,
                'admin_id' => $request->user()?->id,
            ]);

            $message = $campaign->status === 'sent'
                ? 'Marketing notification sent successfully.'
                : ($campaign->status === 'failed'
                    ? 'Marketing notification processed but failed to reach any recipient — check the log for SMS provider errors.'
                    : 'Marketing notification queued for delivery.');
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $campaign,
        ], 201);
    }

    public function audienceCount(Request $request, MarketingNotificationService $service): JsonResponse
    {
        // Accept a comma-separated string from query params or a JSON array.
        $request->merge(['target_user_ids' => $this->extractUserIds($request->input('target_user_ids'))]);

        $data = $request->validate([
            'target_type' => ['required', 'in:all,teachers,students,single_user,multi_teachers,multi_students'],
            'target_user_id' => ['nullable', 'required_if:target_type,single_user', 'integer', 'exists:users,id'],
            'target_user_ids' => ['nullable', 'array', 'required_if:target_type,multi_teachers', 'required_if:target_type,multi_students'],
            'target_user_ids.*' => ['integer', 'exists:users,id'],
        ]);
        $campaign = new MarketingNotification($data);

        return response()->json(['success' => true, 'data' => ['total_targeted' => $service->recipientCount($campaign)]]);
    }

    public function usersSearch(Request $request): JsonResponse
    {
        $data = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:100'],
            'role' => ['nullable', 'integer', 'in:2,3,4'],
        ]);
        $query = trim($data['q']);

        $users = User::query()->select('id', 'first_name', 'last_name', 'email', 'phone_number', 'role_id')
            ->where(function ($builder) use ($query) {
                $builder->where('first_name', 'like', "%{$query}%")->orWhere('last_name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%")->orWhere('phone_number', 'like', "%{$query}%");
            })
            ->when(!empty($data['role']), fn ($builder) => $builder->where('role_id', $data['role']))
            ->orderBy('first_name')->limit(15)->get()->map(fn (User $user) => [
                'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
                'phone_number' => $user->phone_number, 'role_id' => $user->role_id,
            ]);

        return response()->json(['success' => true, 'data' => $users]);
    }

    private function extractUserIds(mixed $value): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        $ids = is_array($value) ? $value : explode(',', (string) $value);

        return array_values(array_unique(array_filter(array_map('intval', $ids), fn (int $id) => $id > 0)));
    }
}
