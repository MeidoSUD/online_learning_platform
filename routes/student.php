<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\CourseController;
use App\Http\Controllers\API\LessonController;
use App\Http\Controllers\API\BookingController;
use App\Http\Controllers\API\PaymentController;
use App\Http\Controllers\API\ReviewController;
use App\Http\Controllers\API\ServicesController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\OrdersController;
use App\Http\Controllers\API\DisputeController;
use App\Http\Controllers\API\UserPaymentMethodController;
use App\Http\Controllers\API\SessionsController;
use App\Http\Controllers\FCMTokenController;
use App\Http\Controllers\API\Admin\TermsConditionsAdminController;
use App\Http\Controllers\API\BookingCourseController;
use App\Http\Controllers\API\FavoriteController;

// Student routes with 'student' role middleware
Route::prefix('student')->middleware(['auth:sanctum', 'role:student'])->group(function () {
    // fcm token
    Route::post('/save-fcm-token', [FCMTokenController::class, 'save']);
    // services
    Route::get('/services', [ServicesController::class, 'studentIndex']);
    Route::get('/services/{serviceId}/subjects', [ServicesController::class, 'getSubjectsByService']);
    // all teachers
    Route::get('/teachers', [UserController::class, 'listTeachers']);
    Route::get('/teachers/{id}', [UserController::class, 'teacherDetails']);
    // subjects
    Route::get('/subjects', [ServicesController::class, 'listSubjects']);
    Route::get('/subjects/{id}', [ServicesController::class, 'subjectDetails']);
    //courses
    Route::get('/courses', [CourseController::class, 'index']); // browse/search
    Route::get('/courses/{id}', [CourseController::class, 'show']); // course details
    Route::get('/courses/{id}/groups', [CourseController::class, 'getCourseGroups']); // get group course groups
    Route::post('/courses/{id}/enroll', [CourseController::class, 'enroll']); // book/join course
    Route::post('/courses/{id}/request-enrollment', [CourseController::class, 'requestEnrollment']); // request enrollment (pending)
    // lessons
    Route::get('/courses/{course_id}/lessons', [LessonController::class, 'index']);
    Route::get('/lessons/{id}', [LessonController::class, 'show']);
    Route::post('/lessons/{id}/complete', [LessonController::class, 'markComplete']);
    // Orders
    Route::post('/orders', [OrdersController::class, 'store']);
    Route::get('/orders', [OrdersController::class, 'index']);
    Route::get('/orders/{id}', [OrdersController::class, 'show']);
    Route::put('/orders/{id}', [OrdersController::class, 'update']);
    Route::delete('/orders/{id}', [OrdersController::class, 'destroy']);
    Route::get('/orders/{order_id}/applications', [OrdersController::class, 'getApplications']);
    Route::post('/orders/{order_id}/applications/{application_id}/accept', [OrdersController::class, 'acceptApplication']);
    // bookings
    Route::post('/booking', [BookingController::class, 'createBooking']); // create booking
    Route::get('/booking', [BookingController::class, 'getStudentBookings']);   // list my bookings
    Route::get('/booking/{bookingId}', [BookingController::class, 'getBookingDetails']); // view specific booking
    Route::put('/booking/{bookingId}/cancel', [BookingController::class, 'cancelBooking']); // cancel booking
    Route::post('/booking/pay', [BookingController::class, 'payBooking']); // pay for booking (card payment)

    // Create checkout session (requires authentication)
    Route::post('payments/checkout', [PaymentController::class, 'createCheckout']);
    // Check payment status (public - called after payment widget completes)
    Route::post('payments/status', [PaymentController::class, 'paymentStatus']);
    // List user's saved cards (requires authentication)
    Route::get('payments/saved-cards', [PaymentController::class, 'listSavedCards']);
    // Set default saved card
    Route::post('payments/saved-cards/{savedCard}/default', [PaymentController::class, 'setDefaultSavedCard']);
    // Delete saved card
    Route::delete('payments/saved-cards/{savedCard}', [PaymentController::class, 'deleteSavedCard']);

    // Status check endpoint - Mobile app can poll this to check payment status
    Route::get('/payments/{paymentId}/status', [BookingController::class, 'checkPaymentStatus']);
    Route::get('/payments/callback', [BookingController::class, 'handlePaymentCallback']); // No name - use the public callback route above
    // payments history
    Route::post('/payments', [PaymentController::class, 'store']); // pay for booking/course
    Route::get('/payments/history', [PaymentController::class, 'history']); // payment history
    // sessions
    Route::get('/sessions', [SessionsController::class, 'index']); // list my sessions
    Route::get('/teachers/{id}/sessions', [BookingController::class, 'mySessions']);
    Route::get('/sessions/grouped', [SessionsController::class, 'groupedSessions']); // teacher: grouped sessions by time
    Route::get('/sessions/{id}', [SessionsController::class, 'show']); // session details
    Route::post('/sessions/{id}/join', [SessionsController::class, 'join']); // join session
    Route::post('/sessions/{id}/chat-token', [SessionsController::class, 'getChatToken']); // get chat token
    // add payment method
    Route::get('payment-methods', [UserPaymentMethodController::class, 'index']);
    Route::post('payment-methods', [UserPaymentMethodController::class, 'store']);
    Route::put('payment-methods/{id}', [UserPaymentMethodController::class, 'update']);
    Route::delete('payment-methods/{id}', [UserPaymentMethodController::class, 'destroy']);
    // courses reviews
    Route::get('/courses/{course_id}/reviews', [ReviewController::class, 'index']);
    Route::post('/courses/{course_id}/reviews', [ReviewController::class, 'store']);
    Route::delete('/courses/{course_id}/reviews/{id}', [ReviewController::class, 'destroy']);


    //disputes
    Route::post('/disputes', [DisputeController::class, 'store']); // Create new dispute      
    Route::get('/disputes/my', [DisputeController::class, 'index']); // List my disputes
    Route::get('/disputes/{id}', [DisputeController::class, 'show']); // View specific dispute
    Route::delete('/disputes/{id}', [DisputeController::class, 'destroy']); // Delete specific dispute

    // certificates
    Route::get('/certificates', [UserController::class, 'listCertificates']);
    // by ab
    Route::post('/booking/course', [BookingCourseController::class, 'createBooking']); // create booking

    // Favorites
    Route::post('/favorites/{teacher}/toggle', [FavoriteController::class, 'toggle']);
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::get('/favorites/{teacher}/status', [FavoriteController::class, 'status']);
});
