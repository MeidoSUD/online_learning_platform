<?php

namespace App\Http\Controllers;

use App\Models\Instruction;
use Illuminate\Http\Request;

class InstructionController extends Controller
{
    public function index(Request $request)
    {
        $query = Instruction::query()->where('is_active', true);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('target_audience')) {
            $query->where(function($q) use ($request) {
                $q->where('target_audience', $request->target_audience)
                  ->orWhere('target_audience', 'both');
            });
        }

        $instructions = $query->get();

        return response()->json([
            'success' => true,
            'data' => $instructions
        ]);
    }
}
