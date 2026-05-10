# Check Teacher Profile Completion Status

## How to See What's Missing

1. **Check Laravel Logs**
   ```bash
   tail -f storage/logs/laravel.log
   ```

2. **Call the listTeachers endpoint** - This will trigger the helper function and show logs
   ```bash
   curl -X GET "http://localhost:8000/api/teachers" \
     -H "Authorization: Bearer {token}"
   ```

3. **Look for messages like:**
   ```
   [2026-05-08 10:30:00] local.WARNING: TeacherProfileHelper: Service incomplete {
     "teacher_id": 27,
     "teacher_name": "Ahmed Hassan",
     "service": "language_study",
     "reason": "Language Study Service: You must add at least one available time slot."
   }
   ```

## What Each Missing Part Means

### Language Study Missing:
- `"No TeacherInfo record"` → Go to teacher profile, set hourly rate
- `"No hour price set"` → Set individual_hour_price > 0
- `"No available slots"` → Teacher must add available time slots
- `"No languages added"` → Teacher must add at least one language

### Private Lessons Missing:
- `"No TeacherInfo record"` → Go to teacher profile, set hourly rate
- `"No hour price set"` → Set individual_hour_price > 0
- `"No available slots"` → Teacher must add available time slots
- `"No subjects added"` → Teacher must add at least one subject

### Courses Missing:
- `"No courses created"` → Teacher must create at least one course

## Fix Steps

1. **Check current logs:**
   ```bash
   tail -50 storage/logs/laravel.log | grep "TeacherProfileHelper"
   ```

2. **For each teacher, see what's missing**

3. **Complete the missing data in database** OR **have teacher complete it in app**

4. **Call listTeachers endpoint again** - It will automatically update profile_completed

## Expected Flow

```
Before: Teachers manually set profile_completed = 1
❌ Problem: Still shows empty list

After: Helper runs on every listTeachers call
✅ Solution: Checks current data, updates profile_completed automatically
✅ Logs show exactly what's missing
```

## Quick Database Checks

### Check teacher_info
```sql
SELECT teacher_id, individual_hour_price FROM teacher_info WHERE teacher_id = 27;
```

### Check available_slots
```sql
SELECT COUNT(*) as slots_count FROM availability_slots WHERE teacher_id = 27;
```

### Check languages
```sql
SELECT COUNT(*) as languages_count FROM teacher_languages WHERE teacher_id = 27;
```

### Check subjects
```sql
SELECT COUNT(*) as subjects_count FROM teacher_subject WHERE teacher_id = 27;
```

### Check services
```sql
SELECT ts.id, s.key_name FROM teacher_services ts 
JOIN services s ON ts.service_id = s.id 
WHERE ts.teacher_id = 27;
```

## Steps to Debug

1. Pick a teacher ID (e.g., 27)
2. Run the SQL checks above
3. Call `/api/teachers` endpoint
4. Check logs: `tail -f storage/logs/laravel.log`
5. See which data is missing
6. Add missing data
7. Call endpoint again - it will update automatically
