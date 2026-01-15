# Teacher Filtering API Guide

## Overview

The `listTeachers` endpoint now supports multiple filter parameters to help users find teachers based on different criteria. This guide explains all available filters and how to use them.

---

## Endpoint

```
GET /api/teachers
```

**Authentication**: Not required (public endpoint)

**Response Format**: Paginated list of teachers with their details

---

## Available Filter Parameters

### 1. Service Filter 🎯

Filter teachers by the services they offer:
- **Private Lessons** (individual_lessons)
- **Language Study** (language_study)
- **Courses** (courses)

#### Parameters

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `service_id` | Integer | `1` | Filter by service ID |
| `service` | String | `private_lessons` | Filter by service key_name (case-insensitive) |

#### Examples

**Get all teachers offering private lessons (by ID)**:
```
GET /api/teachers?service_id=1
```

**Get all teachers offering language study (by key_name)**:
```
GET /api/teachers?service=language_study
```

**Get all teachers offering courses (by ID)**:
```
GET /api/teachers?service_id=3
```

#### Query Logic

- Uses `whereHas()` on `teacherServices` relationship
- Checks the `teacher_services` table for matching service_id
- If `service_id` is numeric, filters by ID
- If `service` is a string, filters by the service's `key_name` field

#### Database Table

```
teacher_services
├── id
├── teacher_id (User id with role_id=3)
├── service_id (services.id)
└── timestamps
```

---

### 2. Price Filter 💰

Filter teachers by their hourly rates.

#### Parameters

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `min_price` | Decimal | `50` | Minimum hourly rate |
| `max_price` | Decimal | `200` | Maximum hourly rate |

#### Examples

**Teachers with hourly rate between 50-150**:
```
GET /api/teachers?min_price=50&max_price=150
```

**Teachers charging at least 100 per hour**:
```
GET /api/teachers?min_price=100
```

**Teachers charging at most 200 per hour**:
```
GET /api/teachers?max_price=200
```

#### Query Logic

- Checks both `individual_hour_price` and `group_hour_price` in `teacher_info` table
- Uses `OR` condition: matches if EITHER price field meets the criteria
- Works with decimal values

---

### 3. Subject/Class/Level Filter 📚

Filter teachers by the subjects they teach.

#### Parameters

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `subject_id` | Integer | `5` | Filter by subject ID |
| `class_id` | Integer | `2` | Filter by class ID |
| `education_level_id` | Integer | `1` | Filter by education level ID |

#### Examples

**Teachers who teach a specific subject**:
```
GET /api/teachers?subject_id=5
```

**Teachers for a specific class**:
```
GET /api/teachers?class_id=2
```

**Teachers for a specific education level**:
```
GET /api/teachers?education_level_id=1
```

**Teachers for a specific subject in a specific class**:
```
GET /api/teachers?subject_id=5&class_id=2
```

#### Query Logic

- Uses `whereHas()` on `subjects` relationship
- Checks `teacher_subjects` join table
- All filters work independently - provide any combination

---

### 4. Language Filter 🌍

Filter teachers by languages they teach (for Language Study service).

#### Parameters

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `language_id` | Integer | `3` | Filter by language ID |

#### Examples

**Teachers who teach English**:
```
GET /api/teachers?language_id=1
```

**Teachers who teach Arabic**:
```
GET /api/teachers?language_id=2
```

#### Query Logic

- Uses `whereHas()` on `teacherLanguages` relationship
- Checks `teacher_languages` table
- Only returns teachers with matching language

---

### 5. Rating Filter ⭐

Filter teachers by their average rating from reviews.

#### Parameters

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `min_rate` | Decimal | `4.0` | Minimum average rating |

#### Examples

**Teachers with at least 4-star average rating**:
```
GET /api/teachers?min_rate=4.0
```

**Teachers with at least 4.5-star average rating**:
```
GET /api/teachers?min_rate=4.5
```

#### Query Logic

- Uses `whereHas()` on `reviews` relationship
- Groups by `reviewed_id` and uses `havingRaw()`
- Calculates average rating across all reviews
- Only returns teachers meeting minimum rating

---

### 6. Search Filter 🔍

Search teachers by name or email (full-text search).

#### Parameters

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `search` | String | `John` | Search term |

#### Examples

**Search by first name**:
```
GET /api/teachers?search=John
```

**Search by last name**:
```
GET /api/teachers?search=Smith
```

**Search by email**:
```
GET /api/teachers?search=john@example.com
```

#### Query Logic

- Uses `LIKE` operator with wildcard matching
- Searches in `first_name`, `last_name`, and `email` fields
- Case-insensitive (SQLite) or case-insensitive by default

---

### 7. Pagination Parameters 📄

Control the number of results per page.

#### Parameters

| Parameter | Type | Default | Example | Description |
|-----------|------|---------|---------|-------------|
| `page` | Integer | `1` | `2` | Which page to retrieve |
| `per_page` | Integer | `10` | `20` | Results per page |

#### Examples

**Get first 10 results** (default):
```
GET /api/teachers
```

**Get second page with 20 results per page**:
```
GET /api/teachers?page=2&per_page=20
```

---

## Combined Filter Examples

### Example 1: Find Private Lesson Teachers with Specific Subject

```
GET /api/teachers?service_id=1&subject_id=5&min_price=50&max_price=200
```

This returns:
- Teachers offering **private lessons** service (service_id=1)
- Who teach **subject 5** (e.g., Mathematics)
- With hourly rates between **$50-200**

### Example 2: Find Highly-Rated Language Teachers

```
GET /api/teachers?service=language_study&language_id=1&min_rate=4.5
```

This returns:
- Teachers offering **language study** service
- Who teach **language 1** (e.g., English)
- With at least **4.5-star average rating**

### Example 3: Find Course Instructors by Search

```
GET /api/teachers?service_id=3&search=John&per_page=20
```

This returns:
- Teachers offering **courses** service
- With "John" in their **first_name**, **last_name**, or **email**
- **20 results per page**

### Example 4: Find Affordable Teachers for Specific Class

```
GET /api/teachers?class_id=5&max_price=100&min_rate=4.0
```

This returns:
- Teachers teaching **class 5**
- Charging **at most $100 per hour**
- With at least **4-star rating**

### Example 5: Complete Advanced Search

```
GET /api/teachers?
  service_id=1
  &education_level_id=2
  &subject_id=10
  &min_price=40
  &max_price=150
  &min_rate=4.0
  &search=Sarah
  &per_page=15
  &page=1
```

This returns:
- Teachers offering **private lessons** service
- For **education level 2**
- Teaching **subject 10**
- With rates between **$40-150**
- With at least **4-star rating**
- Matching search term **"Sarah"**
- **15 results per page, first page**

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone_number": "+966501234567",
      "gender": "male",
      "teacher_type": "individual",
      "profile": {
        "bio": "Experienced mathematics teacher",
        "verified": true
      },
      "teacherInfo": {
        "individual_hour_price": 75,
        "group_hour_price": 50,
        "bio": "10 years teaching experience"
      },
      "teacherServices": [
        {
          "id": 1,
          "service": {
            "id": 1,
            "name_en": "Private Lessons",
            "key_name": "private_lessons"
          }
        }
      ],
      "subjects": [
        {
          "id": 5,
          "name_en": "Mathematics",
          "name_ar": "الرياضيات"
        }
      ],
      "teacherLanguages": [
        {
          "language_id": 1,
          "language": {
            "id": 1,
            "name": "English"
          }
        }
      ],
      "average_rating": 4.5,
      "reviews_count": 12
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 10,
    "total": 45
  }
}
```

### Error Response (Invalid Filter)

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "current_page": 1,
    "last_page": 0,
    "per_page": 10,
    "total": 0
  }
}
```

No results found for the given filters.

---

## Database Relationships

### Key Relationships

```
User (role_id=3)
├── teacherServices (1:Many) → TeacherServices
│   └── service (1:1) → Services
├── teacherInfo (1:1) → TeacherInfo
├── subjects (Many:Many) → Subject (via teacher_subjects)
├── teacherLanguages (1:Many) → TeacherLanguage
│   └── language (1:1) → Language
└── reviews (1:Many) → Review
```

### Service Types

| ID | Key Name | Service Type |
|----|-----------|----|
| 1 | `private_lessons` | Individual/Private Lessons |
| 2 | `language_study` | Language Study |
| 3 | `courses` | Online Courses |

---

## Performance Optimization Tips

1. **Use service_id instead of service key_name**:
   - `?service_id=1` (faster)
   - `?service=private_lessons` (requires extra join)

2. **Combine related filters**:
   - Use `subject_id` instead of `class_id` or `education_level_id` when possible
   - More specific = fewer results = faster queries

3. **Use pagination**:
   - Always use `per_page` parameter
   - Don't request 1000+ results at once
   - Default is 10 per page

4. **Avoid expensive filters when possible**:
   - `min_rate` requires grouping and aggregation
   - Use sparingly with large datasets

---

## Validation Rules

| Parameter | Validation | Error |
|-----------|-----------|-------|
| `service_id` | Must be positive integer or service key_name | No validation error, returns empty |
| `min_price` | Must be numeric, >= 0 | No validation error, returns empty |
| `max_price` | Must be numeric, >= min_price | No validation error, returns empty |
| `subject_id` | Must be positive integer | No validation error, returns empty |
| `language_id` | Must be positive integer | No validation error, returns empty |
| `min_rate` | Must be numeric, 0-5 | No validation error, returns empty |
| `per_page` | Must be positive integer, < 100 | Defaults to 10 |
| `page` | Must be positive integer | Defaults to 1 |

---

## Troubleshooting

### Issue: No results when filtering by service_id

**Possible Causes**:
1. Teacher not linked to service in `teacher_services` table
2. Invalid service_id provided
3. Teacher is inactive (`is_active = 0`)

**Solution**:
```sql
-- Check if teacher has the service
SELECT * FROM teacher_services 
WHERE teacher_id = 1 AND service_id = 1;

-- Check if teacher is active
SELECT is_active FROM users WHERE id = 1 AND role_id = 3;
```

### Issue: No results when filtering by language

**Possible Causes**:
1. Teacher not linked to language in `teacher_languages` table
2. Invalid language_id provided

**Solution**:
```sql
-- Check teacher languages
SELECT * FROM teacher_languages 
WHERE teacher_id = 1;
```

### Issue: Price filter returning unexpected results

**Note**: Filter matches if EITHER `individual_hour_price` OR `group_hour_price` meets criteria.

If you need both prices in range, that's currently not supported. Use individual API calls for this.

### Issue: Very slow queries with multiple filters

**Solution**:
1. Remove `min_rate` filter (expensive)
2. Reduce `per_page` parameter
3. Cache results using Redis for repeated queries

---

## Example Flutter Implementation

```dart
// Filter teachers by service
Future<List<Teacher>> getTeachersByService(int serviceId) async {
  final response = await dio.get(
    '/api/teachers',
    queryParameters: {
      'service_id': serviceId,
      'per_page': 20,
    },
  );
  
  return List<Teacher>.from(
    response.data['data'].map((t) => Teacher.fromJson(t))
  );
}

// Advanced search with multiple filters
Future<List<Teacher>> searchTeachers({
  int? serviceId,
  int? subjectId,
  double? minPrice,
  double? maxPrice,
  double? minRating,
  String? searchTerm,
  int page = 1,
  int perPage = 10,
}) async {
  final response = await dio.get(
    '/api/teachers',
    queryParameters: {
      if (serviceId != null) 'service_id': serviceId,
      if (subjectId != null) 'subject_id': subjectId,
      if (minPrice != null) 'min_price': minPrice,
      if (maxPrice != null) 'max_price': maxPrice,
      if (minRating != null) 'min_rate': minRating,
      if (searchTerm != null) 'search': searchTerm,
      'page': page,
      'per_page': perPage,
    },
  );
  
  return List<Teacher>.from(
    response.data['data'].map((t) => Teacher.fromJson(t))
  );
}
```

---

## API Route Definition

```php
// In routes/api.php
Route::get('/teachers', [UserController::class, 'listTeachers']);

// Also available with authentication (same endpoint, same filters)
Route::prefix('student')->middleware('auth:sanctum')->group(function () {
    Route::get('/teachers', [UserController::class, 'listTeachers']);
});

Route::prefix('teacher')->middleware('auth:sanctum')->group(function () {
    Route::get('/teachers', [UserController::class, 'listTeachers']);
});
```

---

## Summary of Filter Parameters

| Filter | Parameter | Type | Purpose |
|--------|-----------|------|---------|
| **Service** | `service_id` or `service` | int/string | Filter by offering type (private lessons, languages, courses) |
| **Price** | `min_price`, `max_price` | decimal | Filter by hourly rate |
| **Subject** | `subject_id` | int | Filter by subject taught |
| **Class** | `class_id` | int | Filter by class level |
| **Education Level** | `education_level_id` | int | Filter by education system level |
| **Language** | `language_id` | int | Filter by language taught |
| **Rating** | `min_rate` | decimal | Filter by minimum average rating |
| **Search** | `search` | string | Full-text search by name/email |
| **Pagination** | `page`, `per_page` | int | Control result pagination |

