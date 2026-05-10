# TeacherProfileHelper - Profile Completeness Validation

## Overview

The updated `TeacherProfileHelper` validates teacher profile completeness based on their selected services. It ensures that before a teacher can be displayed to students in listings, they must have completed all requirements for their service(s).

---

## Service Requirements

### 1. COURSES Service

**Key Name**: `courses`

**Requirements**:
- ✅ At least one course created

**Validation Code**:
```php
Course::where('teacher_id', $teacher->id)->exists()
```

**Example**:
```
Teacher selects COURSES service
→ Helper checks if teacher has created any courses
→ If yes: service is complete ✅
→ If no: service incomplete, profile incomplete ❌
```

---

### 2. LANGUAGE STUDY Service

**Key Name**: `language_study`

**Requirements**:
- ✅ Teacher info exists with hourly rate set (`individual_hour_price > 0`)
- ✅ At least one available time slot created
- ✅ At least one language added (`teacher_languages`)

**Validation Code**:
```php
// Check hourly rate
$teacherInfo = $user->teacherInfo()->first();
if (!$teacherInfo || !$teacherInfo->individual_hour_price || $teacherInfo->individual_hour_price <= 0) {
    return false; // Incomplete
}

// Check available slots
if (!$user->availableSlots()->exists()) {
    return false; // Incomplete
}

// Check languages
if (!$user->teacherLanguages()->exists()) {
    return false; // Incomplete
}
```

**Example**:
```
Teacher selects LANGUAGE_STUDY service
→ Helper checks all 3 requirements:
  1. Hour rate set? (e.g., 100 SAR) ✅
  2. At least one slot available? ✅
  3. At least one language added? (e.g., English, Arabic) ✅
→ All requirements met: service is complete ✅
```

---

### 3. PRIVATE LESSONS Service

**Key Name**: `private_lessons`

**Requirements**:
- ✅ Teacher info exists with hourly rate set (`individual_hour_price > 0`)
- ✅ At least one available time slot created
- ✅ At least one subject added (`subjects`)

**Validation Code**:
```php
// Check hourly rate
$teacherInfo = $user->teacherInfo()->first();
if (!$teacherInfo || !$teacherInfo->individual_hour_price || $teacherInfo->individual_hour_price <= 0) {
    return false; // Incomplete
}

// Check available slots
if (!$user->availableSlots()->exists()) {
    return false; // Incomplete
}

// Check subjects
if (!$user->subjects()->exists()) {
    return false; // Incomplete
}
```

**Example**:
```
Teacher selects PRIVATE_LESSONS service
→ Helper checks all 3 requirements:
  1. Hour rate set? (e.g., 80 SAR) ✅
  2. At least one slot available? ✅
  3. At least one subject added? (e.g., Math, English) ✅
→ All requirements met: service is complete ✅
```

---

## Helper Functions

### 1. `checkAndUpdateProfileCompleted($teacher_id): bool`

Checks profile completeness and updates the `profile_completed` column in users table.

**Usage**:
```php
use App\Helpers\TeacherProfileHelper;

// After teacher adds a language or slot
TeacherProfileHelper::checkAndUpdateProfileCompleted($teacher->id);
// Returns: true if complete, false if incomplete
// Updates: users.profile_completed column
```

**When to Use**:
- After teacher creates a course
- After teacher adds an available slot
- After teacher sets hourly rate
- After teacher adds a language/subject

---

### 2. `isProfileComplete($teacher_id): bool`

Check profile completeness without updating the database.

**Usage**:
```php
$isComplete = TeacherProfileHelper::isProfileComplete($teacher->id);

if ($isComplete) {
    // Profile is complete, can be displayed to students
} else {
    // Profile incomplete, notify teacher
}
```

**Returns**: `true` if all services requirements are met, `false` otherwise

---

### 3. `isServiceComplete(User $user, string $serviceKey): bool`

Check if a specific service has complete data.

**Usage**:
```php
$isCourseComplete = TeacherProfileHelper::isServiceComplete($user, 'courses');
$isLanguageComplete = TeacherProfileHelper::isServiceComplete($user, 'language_study');
$isLessonComplete = TeacherProfileHelper::isServiceComplete($user, 'private_lessons');
```

**Parameters**:
- `$user`: User model (teacher)
- `$serviceKey`: Service key name - `'courses'`, `'language_study'`, or `'private_lessons'`

---

### 4. `getIncompleteReason($teacher_id): ?string`

Get a human-readable reason why profile is incomplete.

**Usage**:
```php
$reason = TeacherProfileHelper::getIncompleteReason($teacher->id);

if ($reason) {
    echo "Profile incomplete: " . $reason;
    // Output: "Language Study Service: You must add at least one available time slot."
} else {
    echo "Profile is complete!";
}
```

**Returns**: String with reason or null if complete

**Example Reasons**:
```
"Language Study Service: Please set your hourly rate."
"Private Lessons Service: You must add at least one available time slot."
"Courses Service: You must create at least one course."
"Language Study Service: You must add at least one language."
"Private Lessons Service: You must add at least one subject."
```

---

### 5. `getServiceIncompleteReason(User $user, string $serviceKey): ?string`

Get incomplete reason for a specific service.

**Usage**:
```php
$reason = TeacherProfileHelper::getServiceIncompleteReason($user, 'language_study');
```

---

### 6. `getTeacherServiceKeys($teacher_id): array`

Get all service keys a teacher has selected.

**Usage**:
```php
$services = TeacherProfileHelper::getTeacherServiceKeys($teacher->id);
// Returns: ['courses', 'private_lessons']
```

**Returns**: Array of service key names

---

### 7. `getTeacherServicesStatus($teacher_id): array`

Get detailed status of all teacher's services.

**Usage**:
```php
$servicesStatus = TeacherProfileHelper::getTeacherServicesStatus($teacher->id);

foreach ($servicesStatus as $service) {
    echo $service['service_name']; // e.g., "Courses"
    echo $service['is_complete']; // true/false
    echo $service['incomplete_reason']; // null or reason string
}
```

**Returns**: Array of services with completion status:
```php
[
    [
        'service_id' => 1,
        'service_name' => 'Courses',
        'service_key' => 'courses',
        'is_complete' => true,
        'incomplete_reason' => null,
    ],
    [
        'service_id' => 2,
        'service_name' => 'Language Study',
        'service_key' => 'language_study',
        'is_complete' => false,
        'incomplete_reason' => 'Language Study Service: You must add at least one available time slot.',
    ],
]
```

---

### 8. `canDisplayToStudents(User $teacher): bool`

Check if teacher can be displayed in student listings.

**Usage**:
```php
if (TeacherProfileHelper::canDisplayToStudents($teacher)) {
    // Include in search results
} else {
    // Exclude from search results
}
```

**Equivalent to**:
```php
return $teacher->profile_completed === true;
```

---

### 9. `validateTeacherProfile($teacher_id): array`

Complete validation report for a teacher's profile.

**Usage**:
```php
$report = TeacherProfileHelper::validateTeacherProfile($teacher->id);

// Returns detailed report:
[
    'valid' => true/false,
    'teacher_id' => 123,
    'teacher_name' => 'John Doe',
    'profile_completed_flag' => true/false,
    'services' => [
        // Service status array
    ],
    'incomplete_reason' => 'Service reason or null',
]
```

**Use Case**: Debugging, admin dashboard, profile verification

---

## Integration with UserController

### Update `listTeachers()` Method

The query already filters by `profile_completed`:

```php
public function listTeachers(Request $request)
{
    $query = User::where('role_id', 3)
        ->where('is_active', 1)
        ->where('profile_completed', 1)  // ✅ Only show complete profiles
        ->with(['teacherInfo', 'teacherServices', 'subjects', 'teacherLanguages']);
    
    // ... rest of query
}
```

This ensures only teachers with `profile_completed = true` appear in student listings.

---

## Integration Points

### 1. After Creating Course

```php
// In CourseController or CourseService
$course = Course::create([...]);

// Mark profile as complete if all requirements met
TeacherProfileHelper::checkAndUpdateProfileCompleted($course->teacher_id);
```

---

### 2. After Adding Available Slot

```php
// In AvailabilitySlotController
$slot = AvailabilitySlot::create([...]);

// Check if profile is now complete
TeacherProfileHelper::checkAndUpdateProfileCompleted($slot->teacher_id);
```

---

### 3. After Setting Hourly Rate

```php
// In UserController::createOrUpdateTeacherInfo()
$info = TeacherInfo::updateOrCreate([...]);

// Check if profile is now complete
TeacherProfileHelper::checkAndUpdateProfileCompleted(auth()->id());
```

---

### 4. After Adding Language/Subject

```php
// In LanguageController or SubjectController
$language = TeacherLanguage::create([...]);

// Check if profile is now complete
TeacherProfileHelper::checkAndUpdateProfileCompleted($language->teacher_id);
```

---

### 5. In Teacher Profile Update Endpoint

```php
public function updateProfile(Request $request)
{
    $teacher = $request->user();
    
    // ... update various profile fields
    
    // After all updates, validate profile completeness
    $isComplete = TeacherProfileHelper::checkAndUpdateProfileCompleted($teacher->id);
    
    if (!$isComplete) {
        $reason = TeacherProfileHelper::getIncompleteReason($teacher->id);
        return response()->json([
            'success' => false,
            'message' => $reason,
            'profile_status' => TeacherProfileHelper::getTeacherServicesStatus($teacher->id),
        ], 422);
    }
    
    return response()->json(['success' => true, 'message' => 'Profile updated']);
}
```

---

## Teacher Profile Status Endpoint (Recommended)

Add a new endpoint to help teachers understand their profile status:

```php
// In UserController
public function getProfileStatus()
{
    $teacher = auth()->user();
    
    // Validate current status
    $report = TeacherProfileHelper::validateTeacherProfile($teacher->id);
    
    return response()->json([
        'success' => true,
        'data' => $report,
    ]);
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "valid": false,
    "teacher_id": 27,
    "teacher_name": "Ahmed Hassan",
    "profile_completed_flag": false,
    "services": [
      {
        "service_id": 1,
        "service_name": "Courses",
        "service_key": "courses",
        "is_complete": true,
        "incomplete_reason": null
      },
      {
        "service_id": 2,
        "service_name": "Language Study",
        "service_key": "language_study",
        "is_complete": false,
        "incomplete_reason": "Language Study Service: You must add at least one available time slot."
      }
    ],
    "incomplete_reason": "Language Study Service: You must add at least one available time slot."
  }
}
```

---

## Database Column

The `users` table has a `profile_completed` column:

```sql
ALTER TABLE users ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE;
```

**States**:
- `true (1)`: Profile is complete, can be displayed to students
- `false (0)`: Profile is incomplete, hidden from student listings

---

## Migration Workflow for Teachers

### Step 1: Select Service(s)
```
Teacher selects: "Private Lessons" and "Language Study"
→ profile_completed = false (not yet complete)
```

### Step 2: Complete Private Lessons Requirements
```
Teacher adds:
1. Sets hourly rate: 100 SAR ✅
2. Adds available slots ✅
3. Adds subjects ✅

→ Private Lessons service: COMPLETE ✅
→ But Language Study still incomplete (no languages added yet)
→ profile_completed = false
```

### Step 3: Complete Language Study Requirements
```
Teacher adds:
1. Adds languages (English, Arabic) ✅
2. Available slots already added ✅
3. Hourly rate already set ✅

→ Language Study service: COMPLETE ✅
→ ALL services complete!
→ profile_completed = true ✅

Teacher now appears in student search results!
```

---

## Error Messages for Teachers

Use `getIncompleteReason()` to provide clear feedback:

```
❌ "Courses Service: You must create at least one course."
❌ "Language Study Service: Please set your hourly rate."
❌ "Language Study Service: You must add at least one available time slot."
❌ "Language Study Service: You must add at least one language."
❌ "Private Lessons Service: You must add at least one subject."
```

---

## Testing the Helper

```php
use App\Helpers\TeacherProfileHelper;
use App\Models\User;

// Test 1: Check incomplete profile
$teacher = User::find(27);
$reason = TeacherProfileHelper::getIncompleteReason($teacher->id);
// Output: "Language Study Service: You must add at least one language."

// Test 2: Get services status
$status = TeacherProfileHelper::getTeacherServicesStatus($teacher->id);
// Output: Detailed array of each service status

// Test 3: Full validation report
$report = TeacherProfileHelper::validateTeacherProfile($teacher->id);
// Output: Complete diagnostic report

// Test 4: Update and check
TeacherProfileHelper::checkAndUpdateProfileCompleted($teacher->id);
// Updates users.profile_completed based on current data
```

---

## Summary

✅ **Service-based validation**: Different services have different requirements  
✅ **Clear error messages**: Teachers know exactly what to complete  
✅ **Prevents incomplete profiles**: Ensures data quality in student listings  
✅ **Flexible API**: Use individual functions or full validation  
✅ **Database tracking**: `profile_completed` flag maintained automatically  

