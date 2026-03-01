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
    use App\Http\Controllers\API\Admin\GalleryController;
    use App\Http\Controllers\API\Admin\DisputeAdminController;
    use App\Http\Controllers\API\Admin\BookingAdminController;
    use App\Http\Controllers\API\Admin\PaymentAdminController;
    use App\Http\Controllers\API\Admin\ClassesAdminController;
    use App\Http\Controllers\API\Admin\SubjectAdminController;
    use App\Http\Controllers\API\Admin\EducationLevelAdminController;
    use App\Http\Controllers\API\Admin\CourseAdminController;
    use App\Http\Controllers\API\Admin\SupportTicketController;
 
  
    use App\Http\Controllers\API\Admin\InstituteController;
    use App\Models\Payment;
    use App\Models\User;
    // Agora token route for sessions
    use App\Services\AgoraService;
    use Illuminate\Support\Facades\Lang;

    use App\Http\Controllers\API\BookingCourseController;
    use App\Http\Controllers\API\AppVersionController;
    use App\Http\Controllers\API\AdsController;
    use App\Http\Controllers\API\Admin\AdsAdminController;
    /*  
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/              Route::get('/getteachers', [UsersController::class, 'teachers']);

        Route::get('/users', [UsersController::class, 'index']);
        Route::get('/dashboard', [DashboardController::class, 'dashboard']); // Comprehensive admin dashboard


    // Notification route
    Route::post('/send-notification', [FCMTokenController::class, 'sendToToken']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/save-fcm-token', [FCMTokenController::class, 'save']);
        Route::get('/notifications', [FCMTokenController::class, 'getNotifications']);
        Route::post('/notifications/{id}/mark-as-read', [FCMTokenController::class, 'markAsRead']);
        Route::post('/notifications/mark-all-as-read', [FCMTokenController::class, 'markAllAsRead']);
        Route::delete('/notifications/{id}/delete', [FCMTokenController::class, 'deleteNotification']);
        Route::post('/notifications/send', [NotificationController::class, 'sendToToken']);

        // Session Reviews (Accessible by both student and teacher)
        Route::get('/sessions/{session_id}/review', [ReviewController::class, 'getSessionReview']);
        Route::get('/my-session-reviews', [ReviewController::class, 'mySessionReviews']);
        
        // Teacher Reviews
        Route::get('/teachers/{teacher_id}/reviews', [ReviewController::class, 'index']);
        Route::post('/teachers/{teacher_id}/reviews', [ReviewController::class, 'storeTeacherReview']);
    });
    Route::get('/common-subjects', [ServicesController::class, 'getAllSubjects']);
    // main screen APIs
    Route::get('/services', [ServicesController::class, 'listServices']);
    Route::get('/services/search', [ServicesController::class, 'searchServices']);
    Route::get('/subjects/{id}', [ServicesController::class, 'listSubjects']);
    Route::get('/subjects/{id}', [ServicesController::class, 'subjectDetails']);
    Route::get('categories', [CourseController::class, 'listCategories']);
    Route::get('courses', [CourseController::class, 'index']); // browse/search
    Route::get('courses/{id}', [CourseController::class, 'show']); // course details
    Route::get('language-study', [LanguageStudyController::class, 'index']);
    Route::get('language-study/teachers', [LanguageStudyController::class, 'getAllTeachersWithLanguages']); // Get all teachers with languages
    Route::get('language-study/teacher/{teacherId}', [LanguageStudyController::class, 'getTeacherLanguages']); // Get specific teacher languages
    Route::get('language-study/teachers/filter', [LanguageStudyController::class, 'filterTeachersByLanguage']); // Filter teachers by language
    Route::get('/teachers', [UserController::class, 'listTeachers']);
    Route::get('/teachers/{id}', [UserController::class, 'teacherDetails']);
    Route::get('/education-levels', [EducationLevelController::class, 'levelsWithClassesAndSubjects']);
    Route::get('/classes/{education_level_id}', [EducationLevelController::class, 'classes']);
    Route::get('subjectsClasses/{class_id}', [EducationLevelController::class, 'getSubjectsByClass']);

    // ========================================================================
    // PAYMENT ENDPOINTS - PCI-DSS Compliant (Copy & Pay)
    // ========================================================================
    // These endpoints use HyperPay Copy & Pay widget (hosted payment form)
    // Backend NEVER receives card details - only payment status and tokens
    // ========================================================================


    // DEPRECATED ENDPOINTS - Do not use
    // Route::post('payments/direct', [PaymentController::class, 'directPayment']); // ❌ REMOVED - Backend no longer processes cards
    // Route::get('payments/result', [PaymentController::class, 'paymentResult']); // ❌ REMOVED

    // Public callback endpoint for payment gateways (HyperPay will redirect here after OTP/3DS)
    // This must be public (no auth middleware) because the gateway won't include an auth token.
    Route::get('payments/callback', [BookingController::class, 'paymentCallback'])->name('api.payment.callback');
    Route::get('payment-methods', [PaymentMethodController::class, 'index']);
    Route::get('banks', [PaymentMethodController::class, 'banks']);

    // ======================
    // App Config & Version Management (Public - no auth required)
    // ======================
    Route::get('config', [AppVersionController::class, 'getConfig']); // Get latest app version info
    
    // ======================
    // Ads Panel (Public - accessible to all, role-based filtering)
    // ======================
    Route::get('ads', [AdsController::class, 'getAds']); // Get active ads based on user role
    Route::get('ads/{id}', [AdsController::class, 'getAdById']); // Get single ad
    // ======================
    // Authentication & User Management
    // ======================
    Route::prefix('auth')->group(function () {
        Route::middleware('auth:sanctum')->get('user/details', [AuthController::class, 'getUserDetails']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('register', [AuthController::class, 'register']); // Unified register - routes to teacher or student
        Route::post('register-teacher', [AuthController::class, 'registerTeacher']); // Explicit teacher registration
        Route::post('register-student', [AuthController::class, 'registerStudent']); // Explicit student registration
        Route::post('verify', [AuthController::class, 'verifyCode']);
        Route::post('resend-code', [AuthController::class, 'resendCode']);
        Route::post('verify-reset-code', [AuthController::class, 'verifyResetCode']);
        Route::post('reset-password', [AuthController::class, 'resetPassword']);
        Route::post('confirm-password', [AuthController::class, 'confirmResetPassword']);
        Route::post('change-password', [AuthController::class, 'updatePassword'])->middleware('auth:sanctum');
        Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
        Route::post('delete-account', [AuthController::class, 'deleteAccount'])->middleware('auth:sanctum');
        Route::get('profile', [AuthController::class, 'profile'])->middleware('auth:sanctum');
    });
    // ======================
    // Profile (Shared)
    // ======================
    Route::prefix('profile')->middleware('auth:sanctum')->group(function () {
        Route::post('/teacher/info', [UserController::class, 'updateTeacherInfo']);
        Route::post('/teacher/classes', [UserController::class, 'updateTeacherClasses']);
        Route::post('/teacher/subjects', [UserController::class, 'updateTeacherSubjects']);
        Route::put('/profile/update', [UserController::class, 'updateProfile']);
        Route::post('/profile', [UserController::class, 'storeProfile']);
        Route::get('/profile', [UserController::class, 'showProfile']);
        Route::get('/education-levels', [UserController::class, 'educationLevels']);
        Route::get('/classes/{education_level_id}', [UserController::class, 'classes']);
        Route::delete('/delete', [UserController::class, 'deleteAccount']);
    });
    // ======================
    // Student & Teacher
    // ======================

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
        Route::get('/payments/callback', [BookingController::class, 'handlePaymentCallback'])->name('api.payment.callback');
        // payments history
        Route::post('/payments', [PaymentController::class, 'store']); // pay for booking/course
        Route::get('/payments/history', [PaymentController::class, 'history']); // payment history
        // sessions
        Route::get('/sessions', [SessionsController::class, 'index']); // list my sessions
        Route::get('/sessions/grouped', [SessionsController::class, 'groupedSessions']); // teacher: grouped sessions by time
        Route::get('/sessions/{id}', [SessionsController::class, 'show']); // session details
        Route::post('/sessions/{id}/join', [SessionsController::class, 'join']); // join session
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


    });

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

    
    Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
        // Admin language management routes
        Route::get('/services', [ServicesController::class, 'listServices']);
        Route::get('/services/search', [ServicesController::class, 'searchServices']);
        Route::get('/subjects/{id}', [ServicesController::class, 'listSubjects']);
        Route::get('/subjects/{id}', [ServicesController::class, 'subjectDetails']);
        Route::get('categories', [CourseController::class, 'listCategories']);
        Route::get('courses', [CourseController::class, 'index']); // browse/search
        Route::get('courses/{id}', [CourseController::class, 'show']); // course details
        Route::get('language-study', [LanguageStudyController::class, 'index']);
        Route::get('language-study/teachers', [LanguageStudyController::class, 'getAllTeachersWithLanguages']); // Get all teachers with languages
        Route::get('language-study/teacher/{teacherId}', [LanguageStudyController::class, 'getTeacherLanguages']); // Get specific teacher languages
        Route::get('language-study/teachers/filter', [LanguageStudyController::class, 'filterTeachersByLanguage']); // Filter teachers by language
        Route::get('/teachers', [UserController::class, 'listTeachers']);
        Route::get('/teachers/{id}', [UserController::class, 'teacherDetails']);
        Route::get('/education-levels', [EducationLevelAdminController::class, 'levelsWithClassesAndSubjects']);
        Route::get('/classes/{education_level_id}', [EducationLevelAdminController::class, 'classes']);
        Route::get('subjectsClasses/{class_id}', [EducationLevelAdminController::class, 'getSubjectsByClass']);
        Route::get('/services', [ServicesController::class, 'listServices']);
        Route::get('/languages', [LanguageController::class, 'index']); // List all languages
        Route::post('/languages', [LanguageController::class, 'store']); // Create language
        Route::get('/languages/{id}', [LanguageController::class, 'show']); // Get language details
        Route::put('/languages/{id}', [LanguageController::class, 'update']); // Update language
        Route::delete('/languages/{id}', [LanguageController::class, 'destroy']); // Soft delete language
        Route::delete('/languages/{id}/force', [LanguageController::class, 'forceDestroy']); // Hard delete language
        Route::post('/languages/{id}/restore', [LanguageController::class, 'restore']); // Restore soft-deleted language
        // Education Levels
        Route::get('/education-levels', [EducationLevelAdminController::class, 'index']); // List all education levels
        Route::post('/education-levels', [EducationLevelAdminController::class, 'store']); // Create education level
        Route::get('/education-levels/{id}', [EducationLevelAdminController::class, 'show']); // Get education level details
        Route::put('/education-levels/{id}', [EducationLevelAdminController::class, 'update']); // Update education level
        Route::delete('/education-levels/{id}', [EducationLevelAdminController::class, 'destroy']); // Soft delete education level
        Route::delete('/education-levels/{id}/force', [EducationLevelAdminController::class, 'forceDestroy']); // Hard delete education level
        Route::post('/education-levels/{id}/restore', [EducationLevelAdminController::class, 'restore']); // Restore soft-deleted education level

        // Classes
        Route::get('/classes', [ClassesAdminController::class, 'index']); // List all classes
        Route::post('/classes', [ClassesAdminController::class, 'store']); // Create class
        Route::get('/classes/{id}', [ClassesAdminController::class, 'show']); // Get class details
        Route::put('/classes/{id}', [ClassesAdminController::class, 'update']); // Update class
        Route::delete('/classes/{id}', [ClassesAdminController::class, 'destroy']); // Soft delete class
        Route::delete('/classes/{id}/force', [ClassesAdminController::class, 'forceDestroy']); // Hard delete class
        Route::post('/classes/{id}/restore', [ClassesAdminController::class, 'restore']); // Restore soft-deleted class

        // Subjects
        Route::get('/subjects', [SubjectAdminController::class, 'index']); // List all subjects
        Route::post('/subjects', [SubjectAdminController::class, 'store']); // Create subject
        Route::get('/subjects/{id}', [SubjectAdminController::class, 'show']); // Get subject details
        Route::put('/subjects/{id}', [SubjectAdminController::class, 'update']); // Update subject
        Route::delete('/subjects/{id}', [SubjectAdminController::class, 'destroy']); // Soft delete subject
        Route::delete('/subjects/{id}/force', [SubjectAdminController::class, 'forceDestroy']); // Hard delete subject
        Route::post('/subjects/{id}/restore', [SubjectAdminController::class, 'restore']); // Restore soft-deleted subject

        // Courses
        Route::get('/courses', [CourseAdminController::class, 'index']); // List all courses
        Route::get('/courses/{id}', [CourseController::class, 'show']); // Get course details
        Route::put('/courses/{id}/approve', [CourseAdminController::class, 'approve']); // Approve course
        Route::put('/courses/{id}/reject', [CourseAdminController::class, 'reject']); // Reject course
        Route::put('/courses/{id}/status', [CourseAdminController::class, 'updateStatus']); // Update course status
        Route::put('/courses/{id}/feature', [CourseController::class, 'feature']); // Mark course as featured
        Route::delete('/courses/{id}', [CourseController::class, 'destroy']); // Delete course
        Route::get('/courses/pending-approval', [CourseController::class, 'pendingApproval']); // Get pending approval courses

        // Dashboard / system
        Route::get('/dashboard', [DashboardController::class, 'dashboard']); // Comprehensive admin dashboard
        Route::get('/stats', [DashboardController::class, 'stats']);
        Route::get('/health', [DashboardController::class, 'health']);

        // Users management
        Route::get('/users', [UsersController::class, 'index']);
        Route::get('/users/{id}', [UsersController::class, 'show']);
        Route::post('/users', [UsersController::class, 'store']); // create admin user or seed
        Route::put('/users/{id}', [UsersController::class, 'update']);
        Route::delete('/users/{id}', [UsersController::class, 'destroy']);
        Route::get('/teachers', [UsersController::class, 'teachers']);
        Route::get('/teachers/{id}', [UsersController::class, 'teacherDetails']);

        // User actions: reset password, verify teacher, suspend/activate
        Route::put('/users/{id}/reset-password', [UsersController::class, 'resetPassword']);
        Route::put('/users/{id}/verify-teacher', [UsersController::class, 'verifyTeacher']);
        Route::put('/users/{id}/suspend', [UsersController::class, 'suspend']);
        Route::put('/users/{id}/activate', [UsersController::class, 'activate']);

        // Bookings & payments
        Route::get('/bookings', [BookingAdminController::class, 'index']);
        Route::get('/bookings/{id}', [BookingAdminController::class, 'show']);
        Route::post('/bookings/{id}/mark-paid', [BookingAdminController::class, 'markPaid']);
        Route::post('/bookings/{id}/refund', [BookingAdminController::class, 'refund']);

        Route::get('/payments', [PaymentAdminController::class, 'index']);
        Route::get('/payments/{id}', [PaymentAdminController::class, 'show']);
        Route::post('/payments/{id}/reconcile', [PaymentAdminController::class, 'reconcile']);

        // Disputes
        Route::get('/disputes', [DisputeAdminController::class, 'index']);
        Route::get('/disputes/{id}', [DisputeAdminController::class, 'show']);
        Route::post('/disputes/{id}/resolve', [DisputeAdminController::class, 'resolve']);

        // Support Tickets
        Route::get('/support-tickets', [SupportTicketController::class, 'index']);
        Route::get('/support-tickets/stats', [SupportTicketController::class, 'getStats']);
        Route::get('/support-tickets/{id}', [SupportTicketController::class, 'show']);
        Route::post('/support-tickets/{id}/reply', [SupportTicketController::class, 'addReply']);
        Route::post('/support-tickets/{id}/resolve', [SupportTicketController::class, 'resolve']);
        Route::put('/support-tickets/{id}/status', [SupportTicketController::class, 'updateStatus']);
        Route::post('/support-tickets/{id}/close', [SupportTicketController::class, 'close']);
        Route::delete('/support-tickets/{id}', [SupportTicketController::class, 'destroy']);

        // Institute Registration Management
        Route::get('/institutes', [InstituteController::class, 'index']);
        Route::get('/institutes/stats', [InstituteController::class, 'getStats']);
        Route::get('/institutes/{id}', [InstituteController::class, 'show']);
        Route::post('/institutes/{id}/approve', [InstituteController::class, 'approve']);
        Route::post('/institutes/{id}/reject', [InstituteController::class, 'reject']);
        Route::put('/institutes/{id}', [InstituteController::class, 'update']);
        Route::delete('/institutes/{id}', [InstituteController::class, 'destroy']);

        // Payouts / transfer to teachers
        Route::get('/payout-requests', [PayoutAdminController::class, 'index']);
        Route::post('/payout-requests', [PayoutAdminController::class, 'store']);
        Route::post('/payout-requests/{id}/mark-sent', [PayoutAdminController::class, 'markSent']);
        Route::post('/payout-requests/{id}/approve', [PayoutAdminController::class, 'approve']);
        Route::post('/payout-requests/{id}/reject', [PayoutAdminController::class, 'reject']);


        // Gallery / media control
        Route::get('/gallery', [GalleryController::class, 'index']);
        Route::post('/gallery', [GalleryController::class, 'store']);
        Route::delete('/gallery/{id}', [GalleryController::class, 'destroy']);

        // Misc admin tasks
        Route::post('/run-scheduler', [SystemController::class, 'runScheduler']);
        Route::post('/clear-cache', [SystemController::class, 'clearCache']);

        // App Version Management
        Route::get('/app-versions', [AppVersionController::class, 'listAppVersions']); // List all app versions
        Route::post('/app-versions', [AppVersionController::class, 'storeAppVersion']); // Create new app version
        Route::put('/app-versions/{id}', [AppVersionController::class, 'updateAppVersion']); // Update app version

        // Ads Panel Management
        Route::get('/ads', [AdsAdminController::class, 'listAds']); // List all ads with filters
        Route::post('/ads', [AdsAdminController::class, 'createAd']); // Create new ad with image upload
        Route::post('/ads/{id}', [AdsAdminController::class, 'updateAd']); // Update ad (use POST for multipart)
        Route::put('/ads/{id}/toggle', [AdsAdminController::class, 'toggleAdStatus']); // Toggle ad active/inactive
        Route::delete('/ads/{id}', [AdsAdminController::class, 'deleteAd']); // Delete ad
    });
