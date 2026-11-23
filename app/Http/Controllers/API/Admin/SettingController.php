<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    use ApiResponse;
    public function index(Request $request): JsonResponse
    {
        if ($request->has('group') && $request->group !== 'all') {
            return $this->byGroup($request->group);
        }

        if ($request->boolean('grouped')) {
            $settings = Setting::all()->groupBy('group');

            $grouped = [];
            foreach ($settings as $group => $groupSettings) {
                $grouped[$group] = $groupSettings->map(function ($setting) {
                    return [
                        'id' => $setting->id,
                        'key' => $setting->key,
                        'value' => $setting->value,
                        'type' => $setting->type,
                        'group' => $setting->group,
                        'description' => $setting->description,
                    ];
                })->values();
            }

            return $this->success($grouped);
        }

        $settings = Setting::orderBy('id', 'desc')->get();

        return $this->success($settings);
    }

    public function byGroup(string $group): JsonResponse
    {
        $settings = Setting::byGroup($group)->get();

        return $this->success($settings);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $setting = Setting::find($id);

        if (!$setting) {
            return $this->notFoundResponse(message: __('responses.resource_not_found'));
        }

        $validated = $request->validate([
            'value' => 'required',
        ]);

        $setting->value = $validated['value'];
        $setting->save();

        return $this->success($setting, __('responses.operation_successful'));
    }

    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.id' => 'required|integer|exists:settings,id',
            'settings.*.value' => 'required',
        ]);

        foreach ($validated['settings'] as $item) {
            $setting = Setting::find($item['id']);
            if ($setting) {
                $setting->value = $item['value'];
                $setting->save();
            }
        }

        return $this->success([], __('responses.operation_successful'));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => 'required|string|max:191|unique:settings,key',
            'value' => 'nullable',
            'type' => 'required|string|in:string,number,bool,textarea,select,json',
            'group' => 'required|string|max:100',
            'description' => 'nullable|string',
        ]);

        $setting = Setting::create($validated);

        return $this->createdResponse($setting, __('responses.resource_created_successfully'));
    }

    public function destroy(int $id): JsonResponse
    {
        $setting = Setting::find($id);

        if (!$setting) {
            return $this->notFoundResponse(message: __('responses.resource_not_found'));
        }

        $setting->delete();

        return $this->deletedResponse(__('responses.resource_deleted_successfully'));
    }
}
