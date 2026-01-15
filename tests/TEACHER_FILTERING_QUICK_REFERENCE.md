# Teacher Filtering Quick Reference

## Quick Start Examples

### Get All Teachers (No Filter)
```
GET /api/teachers
```

---

## Service Filtering (Main Feature) 🎯

### 1. Get Private Lesson Teachers Only
```
GET /api/teachers?service_id=1
```

**What it returns**: All teachers offering individual/private lessons

**Database check**: Looks in `teacher_services` table for `service_id = 1`

---

### 2. Get Language Study Teachers Only
```
GET /api/teachers?service=language_study
```

**What it returns**: All teachers offering language study service

**Alt syntax**: `GET /api/teachers?service_id=2`

---

### 3. Get Course Instructors Only
```
GET /api/teachers?service_id=3
```

**What it returns**: All teachers who offer online courses

---

## Combined Filters

### Get Private Lesson Teachers Teaching Mathematics
```
GET /api/teachers?service_id=1&subject_id=5
```

### Get Language Teachers Who Speak English
```
GET /api/teachers?service_id=2&language_id=1
```

### Get Private Lesson Teachers Under $100/Hour
```
GET /api/teachers?service_id=1&max_price=100
```

### Get Private Lesson Teachers with 4+ Star Rating
```
GET /api/teachers?service_id=1&min_rate=4.0
```

### Get Private Lesson Teachers for Grade 5 Math
```
GET /api/teachers?service_id=1&class_id=5&subject_id=10
```

---

## Pagination Examples

### Get First 20 Teachers (Instead of Default 10)
```
GET /api/teachers?per_page=20
```

### Get Page 3 with 25 Results Per Page
```
GET /api/teachers?page=3&per_page=25
```

---

## Search Examples

### Search Teacher by Name
```
GET /api/teachers?search=John
```

### Search Teacher by Email
```
GET /api/teachers?search=john@example.com
```

### Search Within Filtered Results
```
GET /api/teachers?service_id=1&search=John
```

---

## Complex Real-World Examples

### "Find me a Private Lesson Teacher for Class 10 Math, under $100/hour"
```
GET /api/teachers?service_id=1&class_id=10&subject_id=15&max_price=100
```

### "Find Language Teachers Teaching English with Good Ratings"
```
GET /api/teachers?service=language_study&language_id=1&min_rate=4.5
```

### "Search for 'Sarah' who teaches Courses"
```
GET /api/teachers?service_id=3&search=Sarah
```

### "Find Affordable Private Lesson Teachers (Under $75) with 4+ Stars"
```
GET /api/teachers?service_id=1&max_price=75&min_rate=4.0&per_page=20
```

---

## Code Implementation

### Laravel/PHP (Backend)

**Current Implementation** - Already handles all these filters:

```php
public function listTeachers(Request $request)
{
    $query = User::where('role_id', 3)
        ->where('is_active', 1)
        ->with(['teacherInfo', 'teacherServices', 'subjects', 'teacherLanguages']);

    // Service filter
    if ($request->filled('service_id') || $request->filled('service')) {
        $serviceParam = $request->input('service_id') ?? $request->input('service');
        $query->whereHas('teacherServices', function ($q) use ($serviceParam) {
            if (is_numeric($serviceParam)) {
                $q->where('service_id', $serviceParam);
            } else {
                $q->whereHas('service', function ($subQ) use ($serviceParam) {
                    $subQ->where('key_name', strtolower($serviceParam));
                });
            }
        });
    }

    // ... other filters ...
    
    return response()->json([
        'success' => true,
        'data' => $teachers->items(),
        'pagination' => [...]
    ]);
}
```

---

### Flutter/Dart

**Example: Filter Teachers by Service**

```dart
import 'package:dio/dio.dart';

class TeacherService {
  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: 'https://your-api.com/api',
    ),
  );

  // Get teachers by service
  Future<List<Teacher>> getTeachersByService(int serviceId) async {
    try {
      final response = await _dio.get(
        '/teachers',
        queryParameters: {
          'service_id': serviceId,
          'per_page': 10,
        },
      );

      if (response.statusCode == 200) {
        List<Teacher> teachers = [];
        for (var teacherJson in response.data['data']) {
          teachers.add(Teacher.fromJson(teacherJson));
        }
        return teachers;
      }
      return [];
    } catch (e) {
      print('Error: $e');
      return [];
    }
  }

  // Advanced filtering
  Future<List<Teacher>> searchTeachers({
    int? serviceId,
    int? classId,
    int? subjectId,
    double? maxPrice,
    double? minRating,
    String? searchTerm,
    int page = 1,
    int perPage = 10,
  }) async {
    try {
      Map<String, dynamic> queryParams = {
        'page': page,
        'per_page': perPage,
      };

      // Add optional filters
      if (serviceId != null) queryParams['service_id'] = serviceId;
      if (classId != null) queryParams['class_id'] = classId;
      if (subjectId != null) queryParams['subject_id'] = subjectId;
      if (maxPrice != null) queryParams['max_price'] = maxPrice;
      if (minRating != null) queryParams['min_rate'] = minRating;
      if (searchTerm != null) queryParams['search'] = searchTerm;

      final response = await _dio.get(
        '/teachers',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        List<Teacher> teachers = [];
        for (var teacherJson in response.data['data']) {
          teachers.add(Teacher.fromJson(teacherJson));
        }
        return teachers;
      }
      return [];
    } catch (e) {
      print('Error: $e');
      return [];
    }
  }
}

// Usage Examples
void main() {
  final teacherService = TeacherService();

  // Example 1: Get Private Lesson Teachers
  teacherService.getTeachersByService(1).then((teachers) {
    print('Found ${teachers.length} private lesson teachers');
  });

  // Example 2: Advanced Search
  teacherService.searchTeachers(
    serviceId: 1,
    classId: 5,
    subjectId: 10,
    maxPrice: 100,
    minRating: 4.0,
  ).then((teachers) {
    print('Found ${teachers.length} matching teachers');
  });

  // Example 3: Search by Name
  teacherService.searchTeachers(
    serviceId: 2,
    searchTerm: 'John',
  ).then((teachers) {
    print('Found ${teachers.length} teachers named John');
  });
}
```

---

### JavaScript/React

**Example: Filter Teachers by Service**

```javascript
import axios from 'axios';

const API_BASE_URL = 'https://your-api.com/api';

// Get teachers by service
export const getTeachersByService = async (serviceId, page = 1, perPage = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/teachers`, {
      params: {
        service_id: serviceId,
        page,
        per_page: perPage,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching teachers:', error);
    throw error;
  }
};

// Advanced search with multiple filters
export const searchTeachers = async (filters) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/teachers`, {
      params: {
        ...filters,
        per_page: filters.perPage || 10,
        page: filters.page || 1,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching teachers:', error);
    throw error;
  }
};

// Usage
// Get private lesson teachers
getTeachersByService(1).then(data => {
  console.log('Private lesson teachers:', data.data);
});

// Advanced search
searchTeachers({
  service_id: 1,
  class_id: 5,
  subject_id: 10,
  max_price: 100,
  min_rate: 4.0,
}).then(data => {
  console.log('Search results:', data);
});
```

---

## Service IDs

| Service | ID | Key Name |
|---------|----|----|
| Private Lessons | 1 | `private_lessons` |
| Language Study | 2 | `language_study` |
| Courses | 3 | `courses` |

**Use either the ID or the key_name in your queries:**
- `?service_id=1` (recommended - faster)
- `?service=private_lessons` (also works)

---

## Filter Parameter Summary

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `service_id` | Integer | - | Filter by service (1=private, 2=language, 3=courses) |
| `service` | String | - | Filter by service key_name (e.g., 'private_lessons') |
| `subject_id` | Integer | - | Filter by subject ID |
| `class_id` | Integer | - | Filter by class ID |
| `education_level_id` | Integer | - | Filter by education level |
| `language_id` | Integer | - | Filter by language (for language study) |
| `min_price` | Decimal | - | Minimum hourly rate |
| `max_price` | Decimal | - | Maximum hourly rate |
| `min_rate` | Decimal | - | Minimum average rating (0-5) |
| `search` | String | - | Search by name or email |
| `page` | Integer | 1 | Page number |
| `per_page` | Integer | 10 | Results per page |

---

## Testing with Postman

### Collection for Testing

1. **Get All Teachers**
   - Method: GET
   - URL: `{{base_url}}/api/teachers`

2. **Get Private Lesson Teachers**
   - Method: GET
   - URL: `{{base_url}}/api/teachers`
   - Params: `service_id: 1`

3. **Get Language Study Teachers**
   - Method: GET
   - URL: `{{base_url}}/api/teachers`
   - Params: `service_id: 2`

4. **Advanced Search**
   - Method: GET
   - URL: `{{base_url}}/api/teachers`
   - Params:
     - `service_id: 1`
     - `class_id: 5`
     - `max_price: 100`
     - `min_rate: 4.0`
     - `per_page: 20`

---

## Troubleshooting

### No results returned?

1. **Check if teachers exist for that service**:
   ```sql
   SELECT DISTINCT service_id FROM teacher_services;
   ```

2. **Check if teachers are active**:
   ```sql
   SELECT COUNT(*) FROM users WHERE role_id = 3 AND is_active = 1;
   ```

3. **Check teacher_services table**:
   ```sql
   SELECT * FROM teacher_services WHERE teacher_id = 1;
   ```

### Getting too many results?

Add more filters:
- `&max_price=150` - Limit by price
- `&min_rate=4.0` - Filter by rating
- `&subject_id=5` - Filter by subject
- `&search=John` - Search by name

### Query too slow?

1. Avoid `min_rate` filter (uses GROUP BY)
2. Add more specific filters (service_id, subject_id, etc.)
3. Reduce `per_page` parameter
4. Use pagination (page=1, page=2, etc.) instead of fetching all at once

---

## Related Routes

All these routes also support the same filters:

```
GET /api/teachers (public)
GET /api/student/teachers (authenticated)
GET /api/teacher/teachers (authenticated)
```

The `listTeachers()` function is used for all three routes, so all filters work everywhere!

