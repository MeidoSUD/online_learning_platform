# Backend Guide: Bookings Table Data Structure

This guide addresses the issue of the Admin Dashboard "Bookings" table showing no data, and explains exactly how the JSON response must be formatted for the frontend table to display it correctly.

## The Issue
The frontend component `components/admin/BookingsTab.tsx` calls `GET /api/admin/bookings`. 
If the table is rendering empty, it means the API is either:
1. Returning an empty array `[]`.
2. Returning a heavily nested object that the `extractArray` helper cannot parse.
3. Returning an array of objects that do not contain the specific flat keys the frontend table uses to render the rows.

## Required JSON Structure
The React table maps over an array of `AdminBooking` objects and expects the following **flat properties** directly on each object.

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "reference": "BKG-987654",
      "student_name": "Omar Ali",
      "teacher_name": "Ahmad Teacher",
      "amount": "150.00",
      "status": "confirmed", 
      "created_at": "2026-05-01T10:00:00Z"
    }
  ]
}
```

### Key Requirements for the Table to Show Data:
1. **`student_name`**: Must be a string directly on the object. Do **not** nest it inside `student: { name: "Omar" }` unless you update the frontend code to match.
2. **`teacher_name`**: Must be a string directly on the object. Do **not** nest it inside `teacher: { name: "Ahmad" }`.
3. **`reference`**: A string representing the booking reference (e.g., `#123` or `BKG-123`).
4. **`amount`**: The cost/price as a string or number.
5. **`status`**: Must be one of `confirmed`, `pending`, `completed`, or `cancelled`.
6. **`created_at`**: A valid date string.

### How to Fix if the Data is Nested:
If your backend uses Laravel Eloquent resources and currently returns nested relationships (e.g., `$booking->teacher->name`), please update the API Resource to flatten the output specifically for this endpoint:

```php
// Laravel Resource Example
public function toArray($request)
{
    return [
        'id' => $this->id,
        'reference' => $this->reference,
        'student_name' => $this->student ? $this->student->first_name . ' ' . $this->student->last_name : 'N/A',
        'teacher_name' => $this->teacher ? $this->teacher->first_name . ' ' . $this->teacher->last_name : 'N/A',
        'amount' => $this->total_price,
        'status' => $this->status,
        'created_at' => $this->created_at->toIso8601String(),
    ];
}
```
If you return data in exactly this format, the Admin Dashboard Bookings table will populate correctly without any frontend changes required.
