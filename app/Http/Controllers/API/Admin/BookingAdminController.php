<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Booking;
use App\Traits\ExportsTabularData;

class BookingAdminController extends Controller
{
    use ExportsTabularData;
    public function index(Request $request)
    {
        $q = Booking::query();

        if ($request->filled('status')) {
            $status = $request->status;
            if ($status === 'pending' || $status === 'pending_payment') {
                $q->whereIn('status', ['pending', 'pending_payment']);
            } else {
                $q->where('status', $status);
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $q->where(function($sub) use ($search) {
                $sub->where('booking_reference', 'like', "%{$search}%")
                    ->orWhereHas('student', function($sq) use ($search) {
                        $sq->where('first_name', 'like', "%{$search}%")
                           ->orWhere('last_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('teacher', function($tq) use ($search) {
                        $tq->where('first_name', 'like', "%{$search}%")
                           ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('date')) {
            $q->whereDate('created_at', $request->date);
        }

        $perPage = (int)$request->input('per_page', 25);
        $paginator = $q->with(['student','teacher'])->orderByDesc('id')->paginate($perPage);
        
        $paginator->getCollection()->transform(function ($booking) {
            return [
                'id' => $booking->id,
                'reference' => $booking->booking_reference,
                'student_name' => $booking->student ? trim($booking->student->first_name . ' ' . $booking->student->last_name) : 'N/A',
                'teacher_name' => $booking->teacher ? trim($booking->teacher->first_name . ' ' . $booking->teacher->last_name) : 'N/A',
                'amount' => $booking->total_amount,
                'status' => $booking->status,
                'created_at' => $booking->created_at ? $booking->created_at->toIso8601String() : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $paginator
        ]);
    }

    public function export(Request $request)
    {
        $query = Booking::with(['student', 'teacher'])->orderByDesc('id');
        if ($request->filled('status')) {
            $status = $request->status;
            if ($status === 'pending' || $status === 'pending_payment') {
                $query->whereIn('status', ['pending', 'pending_payment']);
            } else {
                $query->where('status', $status);
            }
        }

        $rows = $query->get()->map(fn ($booking) => [
            $booking->id,
            $booking->booking_reference,
            $booking->student ? trim($booking->student->first_name . ' ' . $booking->student->last_name) : 'N/A',
            $booking->teacher ? trim($booking->teacher->first_name . ' ' . $booking->teacher->last_name) : 'N/A',
            $booking->total_amount,
            $booking->status,
            optional($booking->created_at)->format('Y-m-d H:i:s'),
        ])->all();

        $headers = ['ID', 'Reference', 'Student', 'Teacher', 'Amount', 'Status', 'Created At'];
        return $request->input('format', 'xlsx') === 'pdf'
            ? $this->pdfResponse($headers, $rows, 'bookings-export')
            : $this->xlsxResponse($headers, $rows, 'bookings-export');
    }

    public function show(Request $request, $id)
    {
        $booking = Booking::with(['student', 'teacher', 'course', 'subject', 'sessions'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $booking]);
    }

    public function markPaid(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);
        $booking->status = 'confirmed';
        $booking->save();
        return response()->json(['success' => true, 'message' => 'Booking marked as paid']);
    }

    public function refund(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);
        $booking->status = 'refunded';
        $booking->save();
        return response()->json(['success' => true, 'message' => 'Booking refunded']);
    }
}
