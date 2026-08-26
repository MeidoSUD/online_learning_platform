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
        $campaign = DB::transaction(function () use ($request, $service) {
            $campaign = MarketingNotification::create($request->validated());
            $campaign->update(['total_targeted' => $service->recipientCount($campaign)]);
            return $campaign->fresh();
        });

        $job = SendMarketingNotificationJob::dispatch($campaign->id);
        if ($campaign->scheduled_at) {
            $job->delay($campaign->scheduled_at);
        }

        return response()->json([
            'success' => true,
            'message' => $campaign->scheduled_at ? 'Marketing notification scheduled successfully.' : 'Marketing notification queued successfully.',
            'data' => $campaign,
        ], 201);
    }

    public function audienceCount(Request $request, MarketingNotificationService $service): JsonResponse
    {
        $data = $request->validate([
            'target_type' => ['required', 'in:all,teachers,students,single_user'],
            'target_user_id' => ['nullable', 'required_if:target_type,single_user', 'integer', 'exists:users,id'],
        ]);
        $campaign = new MarketingNotification($data);

        return response()->json(['success' => true, 'data' => ['total_targeted' => $service->recipientCount($campaign)]]);
    }

    public function usersSearch(Request $request): JsonResponse
    {
        $query = trim((string) $request->validate(['q' => ['required', 'string', 'min:2', 'max:100']])['q']);
        $users = User::query()->select('id', 'first_name', 'last_name', 'email', 'phone_number', 'role_id')
            ->where(function ($builder) use ($query) {
                $builder->where('first_name', 'like', "%{$query}%")->orWhere('last_name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%")->orWhere('phone_number', 'like', "%{$query}%");
            })->orderBy('first_name')->limit(15)->get()->map(fn (User $user) => [
                'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
                'phone_number' => $user->phone_number, 'role_id' => $user->role_id,
            ]);

        return response()->json(['success' => true, 'data' => $users]);
    }
}
