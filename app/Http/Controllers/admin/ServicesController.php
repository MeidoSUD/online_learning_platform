<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use App\Models\Services;

class ServicesController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $pageConfigs = ['pageHeader' => false];
        $role = Role::all();
        $services = Services::all();
        return view('admin.services', ['pageConfigs' => $pageConfigs, 'services' => $services, 'role' => $role]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {   
        $role = Role::all();
        $pageConfigs = ['pageHeader' => false];
        return view('admin.services.create', ['pageConfigs' => $pageConfigs, 'role' => $role]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'description_ar' => 'required|string',
            'description_en' => 'required|string',
            'image' => 'required|image|mimes:jpeg,png,jpg|max:2048',
            'status' => 'required|boolean',
        ]);

        // Handle file upload
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('images/services', 'public');
            $validatedData['image'] = $imagePath;
        }

        Services::create($validatedData);

        return redirect()->route('admin.services.index')->with('success', 'Service created successfully.');
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $pageConfigs = ['pageHeader' => false];
        $service = Services::findOrFail($id);
        return view('admin.services.show', ['pageConfigs' => $pageConfigs, 'service' => $service]);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        $role = Role::all();
        $pageConfigs = ['pageHeader' => false];
        $service = Services::findOrFail($id);
        return view('admin.editServices', ['pageConfigs' => $pageConfigs, 'service' => $service, 'role' => $role]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $service = Services::findOrFail($id);

        // If only is_active is present, just update status
        if ($request->has('is_active') && count($request->all()) == 2) { // 2 = is_active + _token
            $service->is_active = $request->input('is_active');
            $service->save();
            return redirect()->route('admin.services.index')->with('status', 'Service status updated!');
        }

        // Otherwise, validate all fields for a full update
        $validated = $request->validate([
            'name_en' => 'required|string|max:255',
            'name_ar' => 'required|string|max:255',
            'description_en' => 'required|string',
            'description_ar' => 'required|string',
            'image' => 'nullable|image|max:2048',
            'status' => 'required|boolean',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('services', 'public');
        }

        $service->update($validated);

        return redirect()->route('admin.services.index')->with('status', 'Service updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $service = Services::findOrFail($id);
        $service->delete();

        return redirect()->route('admin.services.index')->with('success', 'Service deleted successfully.');
    }

    /**
     * Update the status of the specified resource.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function updateStatus(Request $request, $id)
    {
        $service = Services::findOrFail($id);
        $request->validate(['status' => 'required|boolean']);
        $service->status = $request->status;
        $service->save();
        return redirect()->route('admin.services.index')->with('status', 'Service status updated!');
    }
}
