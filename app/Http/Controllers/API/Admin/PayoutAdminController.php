<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Payout;
class PayoutAdminController extends Controller
{
    public function index(Request $request)
    {
        $payouts = Payout::orderByDesc('id')->with(['paymentMethod','teacher'])->paginate(25);
        return response()->json(['success' => true, 'data' => $payouts]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'teacher_id' => 'required|integer',
            'amount' => 'required|numeric',
            'currency' => 'nullable|string',
            'method' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        $id = DB::table('payouts')->insertGetId(array_merge($data, ['status' => 'pending', 'created_at' => now(), 'updated_at' => now()]));

        return response()->json(['success' => true, 'data' => DB::table('payouts')->where('id', $id)->first()]);
    }

    public function markSent(Request $request, $id)
    {
        DB::table('payouts')->where('id', $id)->update(['status' => 'sent', 'sent_at' => now()]);
        return response()->json(['success' => true]);
    }

    public function approve(Request $request, $id)
    {
        $payout = Payout::findOrFail($id);
        $data = [];
        
        if ($request->hasFile('receipt')) {
            $receipt = $request->file('receipt');
            $filename = 'receipt_' . $id . '_' . time() . '.' . $receipt->getClientOriginalExtension();
            $path = $receipt->storeAs('receipts', $filename, 'public');
            $data['receipt'] = $path;
        }
        
        $data['status'] = 'approved';
        $data['processed_at'] = now();
        
        $payout->update($data);
        
        return response()->json(['success' => true]);
    }

    public function reject(Request $request, $id)
    {
        $payout = Payout::findOrFail($id);
        
        $data = $request->validate([
            'reject_reason' => 'required|string|min:3'
        ]);
        
        $payout->update([
            'status' => 'rejected',
            'reject_reason' => $data['reject_reason'],
            'processed_at' => now()
        ]);
        
        return response()->json(['success' => true]);
    }
  
}
