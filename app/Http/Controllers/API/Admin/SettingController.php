<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        $settings = Setting::orderBy('id', 'desc')->get();
        
        if ($request->has('group')) {
            $settings = Setting::where('group', $request->group)->orderBy('id', 'desc')->get();
        }
        
        return response()->json(['success' => true, 'data' => $settings]);
    }

    public function byGroup(string $group)
    {
        $settings = Setting::where('group', $group)->orderBy('id', 'desc')->get();
        return response()->json(['success' => true, 'data' => $settings]);
    }

    public function update(Request $request, int $id)
    {
        $setting = Setting::find($id);

        if (!$setting) {
            return response()->json(['success' => false, 'message' => __('responses.resource_not_found')], 404);
        }

        $validated = $request->validate([
            'value' => 'required',
            'key' => 'sometimes|string|max:191',
            'type' => 'sometimes|string',
            'group' => 'sometimes|string|max:100',
            'description' => 'nullable|string',
        ]);

        $setting->update($validated);

        return response()->json(['success' => true, 'data' => $setting, 'message' => __('responses.operation_successful')]);
    }

    public function bulkUpdate(Request $request)
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

        return response()->json(['success' => true, 'message' => __('responses.operation_successful')]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string|max:191|unique:settings,key',
            'value' => 'nullable',
            'type' => 'required|string|in:string,number,bool,textarea,select,json',
            'group' => 'required|string|max:100',
            'description' => 'nullable|string',
        ]);

        $setting = Setting::create($validated);

        return response()->json(['success' => true, 'data' => $setting], 201);
    }

    public function destroy(int $id)
    {
        $setting = Setting::find($id);

        if (!$setting) {
            return response()->json(['success' => false, 'message' => __('responses.resource_not_found')], 404);
        }

        $setting->delete();

        return response()->json(['success' => true, 'message' => __('responses.resource_deleted_successfully')]);
    }
}
