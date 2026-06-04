<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\AvailabilityController;
use App\Http\Controllers\API\CourseController;
use App\Http\Controllers\API\LessonController;
use App\Http\Controllers\API\BookingController;
use App\Http\Controllers\API\PaymentController;
use App\Http\Controllers\API\WalletController;
use App\Http\Controllers\API\ReviewController;
use App\Http\Controllers\API\ServicesController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\API\EducationLevelController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\OrdersController;
use App\Http\Controllers\API\TeacherApplicationController;
use App\Http\Controllers\API\DisputeController;
use App\Http\Controllers\API\TeacherController;
use App\Http\Controllers\API\PaymentMethodController;
use App\Http\Controllers\API\UserPaymentMethodController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\API\SessionsController;
use App\Http\Controllers\API\LanguageStudyController;
use App\Http\Controllers\API\LanguageController;
use App\Http\Controllers\FCMTokenController;
use App\Http\Controllers\API\Admin\DashboardController;
use App\Http\Controllers\API\Admin\UsersController;
use App\Http\Controllers\API\Admin\PayoutAdminController;
use App\Http\Controllers\API\Admin\SystemController;
use App\Http\Controllers\API\Admin\ServiceController;
use App\Http\Controllers\API\Admin\ServiceAdminController;
use App\Http\Controllers\API\Admin\GalleryController;
use App\Http\Controllers\API\Admin\DisputeAdminController;
use App\Http\Controllers\API\Admin\BookingAdminController;
use App\Http\Controllers\API\Admin\PaymentAdminController;
use App\Http\Controllers\API\Admin\ClassesAdminController;
use App\Http\Controllers\API\Admin\SubjectAdminController;
use App\Http\Controllers\API\Admin\EducationLevelAdminController;
use App\Http\Controllers\API\Admin\CourseAdminController;
use App\Http\Controllers\API\Admin\SupportTicketController;
use App\Http\Controllers\API\Admin\SettingController;
use App\Http\Controllers\API\Admin\RevenuePercentageController;
use App\Http\Controllers\API\Admin\OrderAdminController;


use App\Http\Controllers\API\Admin\InstituteController;
use App\Models\Payment;
use App\Models\User;
// Agora token route for sessions
use App\Services\AgoraService;
use Illuminate\Support\Facades\Lang;

use App\Http\Controllers\API\BookingCourseController;
use App\Http\Controllers\API\AppVersionController;
use App\Http\Controllers\API\AppConfigController;
use App\Http\Controllers\API\AdsController;
use App\Http\Controllers\API\Admin\AdsAdminController;
use App\Http\Controllers\API\Admin\SessionsAdminController;

Route::prefix('teacher')->middleware(['auth:sanctum', 'role:teacher'])->group(function () {
    Route::get('/education-levels', [EducationLevelController::class, 'levelsWithClassesAndSubjects']);
    Route::get('/classes/{education_level_id}', [EducationLevelController::class, 'classes']);
    Route::get('subjectsClasses/{class_id}', [EducationLevelController::class, 'getSubjectsByClass']);
    Route::get('banks', [PaymentMethodController::class, 'banks']);
    Route::get('get-services', [ServicesController::class, 'teacherServices']);
    Route::post('teacher-service', [ServicesController::class, 'addTeacherService']);
    Route::post('teacher-upload-certificate', [ServicesController::class, 'uploadTeacherCertificate']);
    Route::put('active-status', [UserController::class, 'updateActiveStatus']);
    Route::get('active-status', [UserController::class, 'getActiveStatus']);

    // fcm token
    Route::post('/save-fcm-token', [FCMTokenController::class, 'save']);
    // Teacher Information
    Route::post('/info', [UserController::class, 'createOrUpdateTeacherInfo']);
    // services
    Route::get('/services', [ServicesController::class, 'teacherIndex']);
    // courses
    Route::post('/courses', [CourseController::class, 'store']);
    Route::put('/courses/{id}', [CourseController::class, 'update']);
    Route::delete('/courses/{id}', [CourseController::class, 'destroy']);
    Route::get('/courses', [CourseController::class, 'myCourses']);
    Route::get('/courses/{id}/groups', [CourseController::class, 'getTeacherGroups']);
    Route::post('/courses/{id}/groups', [CourseController::class, 'createGroup']);
    Route::get('/courses/{id}/groups/{groupId}/students', [CourseController::class, 'getGroupStudents']);
    Route::post('/courses/{id}/groups/{groupId}/start', [CourseController::class, 'startGroup']);
    // subjects and classes
    Route::get('subjects', [TeacherController::class, 'indexSubjects']);
    Route::post('subjects', [TeacherController::class, 'storeSubject']);
    Route::delete('subjects/{id}', [TeacherController::class, 'destroySubject']);
    Route::get('classes', [TeacherController::class, 'indexClasses']);
    Route::post('classes', [TeacherController::class, 'storeClass']);
    Route::delete('classes/{id}', [TeacherController::class, 'destroyClass']);
    // availability slots
    Route::get('availability', [AvailabilityController::class, 'index']); // List all my slots
    Route::post('availability', [AvailabilityController::class, 'store']); // Add new slot
    Route::get('availability/{id}', [AvailabilityController::class, 'show']); // Show slot details
    Route::put('availability/{id}', [AvailabilityController::class, 'update']); // Update slot
    Route::delete('availability/{id}', [AvailabilityController::class, 'destroy']); // Delete single slot
    Route::delete('availability', [AvailabilityController::class, 'destroyBatch']); // Delete multiple slots (batch)
    // lessons
    Route::post('/courses/{course_id}/lessons', [LessonController::class, 'store']);
    Route::put('/lessons/{id}', [LessonController::class, 'update']);
    Route::delete('/lessons/{id}', [LessonController::class, 'destroy']);
    // Orders
    Route::get('/orders/browse', [TeacherApplicationController::class, 'browseOrders']);
    Route::post('/orders/{order_id}/apply', [TeacherApplicationController::class, 'apply']);
    Route::get('/my-applications', [TeacherApplicationController::class, 'myApplications']);
    Route::delete('/applications/{application_id}', [TeacherApplicationController::class, 'cancelApplication']);
    // bookings
    Route::post('booking', [BookingController::class, 'index']);
    //sessions
    Route::get('/sessions', [SessionsController::class, 'index']);
    Route::get('/sessions/{id}', [SessionsController::class, 'show']);
    Route::post('/sessions/{id}/start', [SessionsController::class, 'start']);
    Route::post('/sessions/{id}/end', [SessionsController::class, 'end']);

    Route::get('/teachers', [UserController::class, 'listTeachers']);
    Route::get('/teachers/{id}', [UserController::class, 'teacherDetails']);
    //wallet
    Route::get('/wallet', [WalletController::class, 'show']);
    Route::post('/wallet/withdraw', [WalletController::class, 'withdraw']);
    Route::get('/wallet/withdrawals', [WalletController::class, 'listWithdrawals']);
    Route::get('/wallet/withdrawals/{id}', [WalletController::class, 'getWithdrawal']);
    Route::delete('/wallet/withdrawals/{id}', [WalletController::class, 'cancelWithdrawal']);
    // payments methods
    Route::get('payment-methods', [UserPaymentMethodController::class, 'index']);
    Route::post('payment-methods', [UserPaymentMethodController::class, 'store']);
    Route::put('payment-methods/set-default/{id}', [UserPaymentMethodController::class, 'setDefault']);
    Route::delete('payment-methods/{id}', [UserPaymentMethodController::class, 'destroy']);
    // reviews
    Route::get('/courses/{course_id}/reviews', [ReviewController::class, 'index']);
    Route::post('/courses/{course_id}/reviews', [ReviewController::class, 'store']);
    //disputes
    Route::post('/disputes', [DisputeController::class, 'store']); // Create new dispute      
    Route::get('/disputes/my', [DisputeController::class, 'index']); // List my disputes
    Route::get('/disputes/{id}', [DisputeController::class, 'show']); // View specific dispute
    Route::delete('/disputes/{id}', [DisputeController::class, 'destroy']); // Delete specific dispute

    // Language study routes for teachers
    Route::get('language-study/{teacherId}', [LanguageStudyController::class, 'getTeacherLanguages']); // Get specific teacher languages
    Route::post('/language-study/languages', [LanguageStudyController::class, 'addTeacherLanguages']);
    Route::put('/language-study/languages', [LanguageStudyController::class, 'updateTeacherLanguages']);
    Route::delete('/language-study/{languageId}', [LanguageStudyController::class, 'deleteTeacherLanguage']);
});
