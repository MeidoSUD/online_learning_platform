<?php

// app/Models/Sessions.php

namespace App\Models;

use App\Helpers\Helpers;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;
use MacsiDigital\Zoom\Facades\Zoom;
use Illuminate\Support\Facades\Log;
use App\Services\AgoraService;

class Sessions extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'student_id',
        'teacher_id',
        'availability_slot_id',
        'session_title',
        'session_number',
        'session_date',
        'start_time',
        'end_time',
        'duration',
        'status',
        'join_url',
        'host_url',
        'meeting_id',
        'chat_room_id',
        'started_at',
        'ended_at',
        'teacher_notes',
        'homework',
        'materials_shared',
        'student_rating',
        'teacher_rating'
    ];

    protected $casts = [
        'session_date' => 'date:Y-m-d',
        'start_time' => 'date:H:i',
        'end_time' => 'date:H:i',
        'started_at' => 'date:H:i',
        'ended_at' => 'date:H:i',
        'materials_shared' => 'array',
        'duration' => 'integer',
        'session_number' => 'integer',
        'student_rating' => 'integer',
        'teacher_rating' => 'integer',
    ];

    // Status constants
    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_LIVE = 'live';
    const STATUS_ENDED = 'ended';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_WAIT_TEACHER = 'wait_for_teacher';

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class, 'session_id');
    }

    // Scopes
    public function scopeScheduled($query)
    {
        return $query->where('status', self::STATUS_SCHEDULED);
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', self::STATUS_LIVE);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_ENDED);
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', self::STATUS_CANCELLED);
    }

    public function scopeToday($query)
    {
        return $query->where('session_date', now()->format('Y-m-d'));
    }

    public function scopeUpcoming($query)
    {
        return $query->where('status', self::STATUS_SCHEDULED)
            ->where('session_date', '>=', now()->format('Y-m-d'));
    }

    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeForTeacher($query, $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }

    // Accessors & Mutators
    public function getFormattedSessionDateAttribute(): string
    {
        return $this->session_date->format('M d, Y');
    }

    public function getFormattedTimeAttribute(): string
    {
        return $this->start_time->format('H:i') . ' - ' . $this->end_time->format('H:i');
    }

    public function getFormattedDurationAttribute(): string
    {
        $hours = floor($this->duration / 60);
        $minutes = $this->duration % 60;

        if ($hours > 0) {
            return $hours . 'h ' . ($minutes > 0 ? $minutes . 'm' : '');
        }
        return $minutes . 'm';
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_SCHEDULED => 'Scheduled',
            self::STATUS_LIVE => 'Live',
            self::STATUS_ENDED => 'Ended',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_CANCELLED => 'Cancelled',
            self::STATUS_WAIT_TEACHER => 'Waiting for Teacher',
            default => ucfirst($this->status)
        };
    }

    public function getCanJoinAttribute(): bool
    {
        if ($this->status !== self::STATUS_SCHEDULED) {
            return false;
        }

        $now = now();
        $sessionStart = $this->combineDateAndTime($this->session_date, $this->start_time);
        $sessionEnd = $this->combineDateAndTime($this->session_date, $this->end_time);

        // Allow joining 15 minutes before session starts until session ends
        return $now->between($sessionStart->subMinutes(15), $sessionEnd);
    }

    public function getCanStartAttribute(): bool
    {
        if ($this->status !== self::STATUS_SCHEDULED) {
            return false;
        }

        $now = now();
        $sessionStart = $this->combineDateAndTime($this->session_date, $this->start_time);

        // Allow starting 15 minutes before scheduled time
        return $now >= $sessionStart->subMinutes(15);
    }

    public function getCanEndAttribute(): bool
    {
        return $this->status === self::STATUS_LIVE;
    }

    public function getCanCancelAttribute(): bool
    {
        if (in_array($this->status, [self::STATUS_ENDED, self::STATUS_CANCELLED, self::STATUS_WAIT_TEACHER])) {
            return false;
        }

        $sessionStart = $this->combineDateAndTime($this->session_date, $this->start_time);
        return $sessionStart->subHours(4)->isFuture();
    }

    public function getCanRescheduleAttribute(): bool
    {
        if (in_array($this->status, [self::STATUS_ENDED, self::STATUS_CANCELLED, self::STATUS_WAIT_TEACHER])) {
            return false;
        }

        $sessionStart = $this->combineDateAndTime($this->session_date, $this->start_time);
        return $sessionStart->subHours(24)->isFuture();
    }

    public function getActualDurationAttribute(): ?int
    {
        if (!$this->started_at || !$this->ended_at) {
            return null;
        }

        return $this->started_at->diffInMinutes($this->ended_at);
    }

    public function getIsLateAttribute(): bool
    {
        if (!$this->started_at) {
            return false;
        }

        $scheduledStart = Carbon::parse($this->session_date . ' ' . $this->start_time);
        return $this->started_at > $scheduledStart->addMinutes(5); // 5 minutes grace period
    }

    public function getIsOverdueAttribute(): bool
    {
        if ($this->status !== self::STATUS_SCHEDULED) {
            return false;
        }

        $sessionEnd = $this->combineDateAndTime($this->session_date, $this->end_time);
        return now() > $sessionEnd;
    }

    /**
     * Combine a date and time value which may be strings or Carbon instances
     * into a single Carbon instance safely (avoids double-date concatenation).
     *
     * @param \Carbon\Carbon|string|null $date
     * @param \Carbon\Carbon|string|null $time
     * @return \Carbon\Carbon
     */
    private function combineDateAndTime($date, $time): Carbon
    {
        // Normalize date to Y-m-d
        if ($date instanceof Carbon) {
            $dateStr = $date->format('Y-m-d');
        } else {
            $dateStr = trim((string) $date);
            // If date-time string given, extract date part
            if (preg_match('/^(\d{4}-\d{2}-\d{2})/', $dateStr, $m)) {
                $dateStr = $m[1];
            }
        }

        // Normalize time to H:i:s
        if ($time instanceof Carbon) {
            $timeStr = $time->format('H:i:s');
        } else {
            $timeStr = trim((string) $time);
            // If provided as full datetime, extract time part
            if (preg_match('/(\d{2}:\d{2}:?\d{0,2})$/', $timeStr, $m)) {
                $timeStr = $m[1];
            }
        }

        return Carbon::parse($dateStr . ' ' . $timeStr);
    }

    // Methods
    public function start(): bool
    {
        if (!$this->can_start) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_LIVE,
            'started_at' => now(),
        ]);
    }

    public function end(): bool
    {
        if (!$this->can_end) {
            return false;
        }

        $success = $this->update([
            'status' => self::STATUS_ENDED,
            'ended_at' => now(),
        ]);

        if ($success) {
            // Update booking progress
            $this->booking->incrementCompletedSessions();
        }

        return $success;
    }

    public function cancel(string $reason = 'Cancelled by user'): bool
    {
        if (!$this->can_cancel) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_CANCELLED,
            'teacher_notes' => $this->teacher_notes ? $this->teacher_notes . "\n\nCancellation: " . $reason : "Cancelled: " . $reason,
        ]);
    }

    public function markAsNoShow(): bool
    {
        if ($this->status !== self::STATUS_SCHEDULED) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_WAIT_TEACHER,
        ]);
    }

    public function reschedule(string $newDate, string $newStartTime, string $newEndTime): bool
    {
        if (!$this->can_reschedule) {
            return false;
        }

        return $this->update([
            'session_date' => $newDate,
            'start_time' => $newStartTime,
            'end_time' => $newEndTime,
        ]);
    }

    public function addTeacherNotes(string $notes): bool
    {
        return $this->update([
            'teacher_notes' => $this->teacher_notes ? $this->teacher_notes . "\n\n" . $notes : $notes,
        ]);
    }

    public function setHomework(string $homework): bool
    {
        return $this->update(['homework' => $homework]);
    }

    public function shareMaterials(array $materials): bool
    {
        $existingMaterials = $this->materials_shared ?? [];
        $updatedMaterials = array_merge($existingMaterials, $materials);

        return $this->update(['materials_shared' => $updatedMaterials]);
    }

    public function rateByStudent(int $rating): bool
    {
        if ($rating < 1 || $rating > 5) {
            return false;
        }

        return $this->update(['student_rating' => $rating]);
    }

    public function rateByTeacher(int $rating): bool
    {
        if ($rating < 1 || $rating > 5) {
            return false;
        }

        return $this->update(['teacher_rating' => $rating]);
    }

    public function createMeeting(): bool
    {
        // Replace Zoom meeting creation with Agora meeting creation via AgoraService
        try {
            $agoraService = new AgoraService();

            // Pass session id and participants; AgoraService expected to return meeting info array/object
            $meeting = $agoraService->createMeeting($this->id, $this->teacher_id, $this->student_id);

            if (!$meeting) {
                Log::error('AgoraService returned empty meeting for session ' . $this->id);
                return false;
            }

            // Accept both array and object responses
            $meetingId = is_array($meeting) ? ($meeting['id'] ?? null) : ($meeting->id ?? null);
            $joinUrl = is_array($meeting) ? ($meeting['join_url'] ?? null) : ($meeting->join_url ?? null);
            $hostUrl = is_array($meeting) ? ($meeting['host_url'] ?? null) : ($meeting->host_url ?? null);

            $this->update([
                'meeting_id' => $meetingId,
                'join_url' => $joinUrl,
                'host_url' => $hostUrl,
            ]);

            Log::info('Agora meeting created for session', ['session_id' => $this->id, 'meeting' => $meeting]);
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to create Agora meeting for session ' . $this->id . ': ' . $e->getMessage(), [
                'session_date' => (string) $this->session_date,
                'start_time' => (string) $this->start_time,
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    private function generateMeetingPassword(): string
    {
        return 'TUT' . $this->id . rand(100, 999);
    }

    // Add this accessor to get host URL from teacher_notes
    public function getHostUrlAttribute(): ?string
    {
        if (!$this->teacher_notes)
            return null;

        preg_match('/Host URL: (.+)/', $this->teacher_notes, $matches);
        return $matches[1] ?? null;
    }

    // Static methods

    public static function createForBooking(Booking $booking): void
    {
        Log::info('Starting session creation for booking', [
            'booking_id' => $booking->id,
            'session_type' => $booking->session_type,
            'first_session_date' => $booking->first_session_date,
        ]);

        if (!$booking->first_session_date) {
            Log::error('Session creation failed: first_session_date is missing', [
                'booking_id' => $booking->id
            ]);
            return;
        }

        try {
            $booking = $booking->load(['subject.service', 'course', 'courseGroup']);

            $sessionTitle = self::buildSessionTitle($booking);

            if ($booking->course_group_id && $booking->courseGroup) {
                self::createGroupCourseSessions($booking, $sessionTitle);
                return;
            }

            // Package booking with multiple different timeslots
            // When availabilitySlots relationship is loaded with multiple entries,
            // create one session per slot with its own date/time
            $booking->load('availabilitySlots');
            if ($booking->availabilitySlots->count() > 1) {
                foreach ($booking->availabilitySlots as $index => $slot) {
                    $slotDate = $slot->date && trim((string) $slot->date) !== ''
                        ? ($slot->date instanceof Carbon ? $slot->date->format('Y-m-d') : (string) $slot->date)
                        : self::resolveSlotDate($slot);

                    $startTime = self::extractTimeFromValue($slot->start_time);
                    $endTime = self::extractTimeFromValue($slot->end_time);

                    $session = self::create([
                        'booking_id' => $booking->id,
                        'availability_slot_id' => $slot->id,
                        'student_id' => $booking->student_id,
                        'teacher_id' => $booking->teacher_id,
                        'session_number' => $index + 1,
                        'session_title' => $sessionTitle,
                        'session_date' => $slotDate,
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                        'duration' => $slot->duration ?? $booking->session_duration,
                        'status' => self::STATUS_SCHEDULED,
                    ]);

                    if ($session) {
                        Helpers::updateAvailabilitySlot($session->availability_slot_id);
                    }

                    Log::info("Multi-slot session {$session->session_number} created", [
                        'session_id' => $session->id,
                        'booking_id' => $booking->id,
                        'slot_id' => $slot->id,
                        'session_date' => $slotDate,
                    ]);
                }
                return;
            }

            if ($booking->session_type === Booking::TYPE_SINGLE) {
                $session = self::create([
                    'booking_id' => $booking->id,
                    'availability_slot_id' => $booking->availability_slot_id,
                    'student_id' => $booking->student_id,
                    'teacher_id' => $booking->teacher_id,
                    'session_number' => 1,
                    'session_title' => $sessionTitle,
                    'session_date' => $booking->first_session_date,
                    'start_time' => $booking->first_session_start_time,
                    'end_time' => $booking->first_session_end_time,
                    'duration' => $booking->session_duration,
                    'status' => self::STATUS_SCHEDULED,
                ]);
                if ($session) {
                    Helpers::updateAvailabilitySlot($session->availability_slot_id);
                }
                Log::info('Session created for single booking', [
                    'session_id' => $session->id,
                    'booking_id' => $booking->id,
                    'session_title' => $sessionTitle,
                ]);
            } else {
                $startDate = Carbon::parse($booking->first_session_date);

                for ($i = 1; $i <= $booking->sessions_count; $i++) {
                    $sessionDate = $i === 1 ? $startDate : $startDate->copy()->addWeeks($i - 1);

                    $session = self::create([
                        'availability_slot_id' => $booking->availability_slot_id,
                        'booking_id' => $booking->id,
                        'student_id' => $booking->student_id,
                        'teacher_id' => $booking->teacher_id,
                        'session_number' => $i,
                        'session_title' => $sessionTitle,
                        'session_date' => $sessionDate->format('Y-m-d'),
                        'start_time' => $booking->first_session_start_time,
                        'end_time' => $booking->first_session_end_time,
                        'duration' => $booking->session_duration,
                        'status' => self::STATUS_SCHEDULED,
                    ]);
                    if ($session) {
                        Helpers::updateAvailabilitySlot($session->availability_slot_id);
                    }
                    Log::info("Package session {$i} created", [
                        'session_id' => $session->id,
                        'booking_id' => $booking->id,
                        'session_title' => $sessionTitle,
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to create sessions for booking', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    private static function createGroupCourseSessions(Booking $booking, string $sessionTitle): void
    {
        $courseGroup = $booking->courseGroup;
        $schedulePattern = $courseGroup->schedule_pattern;
        $startDate = Carbon::parse($courseGroup->start_date);
        $totalSessions = $courseGroup->total_sessions;

        $time = $schedulePattern['time'] ?? ($schedulePattern['start_time'] ?? '00:00');
        $endTime = $schedulePattern['end_time'] ?? null;
        $startTime = is_string($time) ? $time : Carbon::parse($time)->format('H:i');
        $firstSessionEndTime = $endTime
            ? (is_string($endTime) ? $endTime : Carbon::parse($endTime)->format('H:i'))
            : Carbon::parse($startTime)->copy()->addMinutes($booking->session_duration)->format('H:i');

        $duration = $booking->session_duration;
        if ($endTime) {
            $startCarbon = Carbon::parse($startTime);
            $endCarbon = Carbon::parse($endTime);
            $duration = $startCarbon->diffInMinutes($endCarbon);
        }

        $appDays = $schedulePattern['days'] ?? [];

        if (empty($appDays)) {
            $carbonDays = [$startDate->dayOfWeek];
        } else {
            $carbonDays = array_map(function ($appDay) {
                $appDay = (int) $appDay;
                if ($appDay === 1)
                    return 6;
                return $appDay - 2;
            }, $appDays);
        }

        sort($carbonDays);

        $sessionNumber = 0;
        $currentDate = $startDate->copy();
        $maxIterations = $totalSessions * 10;
        $iterations = 0;

        while ($sessionNumber < $totalSessions && $iterations < $maxIterations) {
            $iterations++;
            $currentDow = $currentDate->dayOfWeek;

            if (in_array($currentDow, $carbonDays)) {
                $sessionNumber++;

                self::create([
                    'availability_slot_id' => $booking->availability_slot_id,
                    'booking_id' => $booking->id,
                    'student_id' => $booking->student_id,
                    'teacher_id' => $booking->teacher_id,
                    'session_number' => $sessionNumber,
                    'session_title' => $sessionTitle,
                    'session_date' => $currentDate->format('Y-m-d'),
                    'start_time' => $startTime,
                    'end_time' => $firstSessionEndTime,
                    'duration' => $duration,
                    'status' => self::STATUS_SCHEDULED,
                ]);
                if ($booking) {
                    Helpers::updateAvailabilitySlot($booking->availability_slot_id);
                }
                Log::info("Group course session {$sessionNumber} created", [
                    'session_date' => $currentDate->format('Y-m-d'),
                    'booking_id' => $booking->id,
                ]);
            }

            $currentDate->addDay();
        }

        if ($booking->courseGroup) {
            $booking->courseGroup->incrementEnrolledCount();
        }
    }

    /**
     * Build session title based on service and language
     * 
     * Rules:
     * - Language Study service: "[Service Name] - [Language Name]" (e.g., "Language Study - English")
     * - Other services: "[Service Name]" (e.g., "Private Lessons", "Courses")
     * - Course bookings: Use course name
     * 
     * @param Booking $booking
     * @return string
     */
    public static function buildSessionTitle(Booking $booking): string
    {
        // If course booking, use course name
        if ($booking->course) {
            Log::info("Group course session ", [
                'course_name' => $booking->course,
                'booking_id' => $booking->id,
            ]);

            return $booking->course->name ?? 'Session2';
        }

        // Service booking - check service type via subject
        if ($booking->subject && $booking->subject->service) {
            $serviceName = ($booking->service->name_en . " " . $booking->subject->name_en) ?? 'Service';
            // successfully  work 10-june
            // Check if language_study service
            // if ($booking->subject->service->key_name === 'language_study') {
            //     // Include language name for language study service
            //     $languageName = $booking->subject->name_en ?? 'Language';
            //     return "{$serviceName} - {$languageName}";
            // }
            Log::info("Group course session ", [
                'service_name' => $serviceName,
                'booking_id' => $booking->id,
                'booking' => $booking,
            ]);
            // Other services - just service name
            return $serviceName;
        }

        // Fallback
        return 'Session55';
    }

    public static function getStatuses(): array
    {
        return [
            self::STATUS_SCHEDULED => 'Scheduled',
            self::STATUS_LIVE => 'Live',
            self::STATUS_ENDED => 'Ended',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_CANCELLED => 'Cancelled',
            self::STATUS_WAIT_TEACHER => 'Waiting for Teacher',
        ];
    }

    // Boot method for model events
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($session) {
            // This creates fake URLs immediately when session is created
            if (!$session->join_url) {
            }
        });

        static::updated(function ($session) {
            // Auto-mark as no-show if session is overdue and still scheduled
            if ($session->status === self::STATUS_SCHEDULED && $session->is_overdue) {
                $session->update(['status' => self::STATUS_WAIT_TEACHER]);
            }
        });
    }

    /**
     * Resolve slot date from date field or day_number.
     */
    private static function resolveSlotDate($slot): string
    {
        if ($slot->day_number !== null) {
            $today = Carbon::today();
            $dayNumberFromApp = (int) $slot->day_number;
            $carbonDayOfWeek = ($dayNumberFromApp === 1) ? 6 : ($dayNumberFromApp - 2);
            $todayDow = $today->dayOfWeek;
            $delta = ($carbonDayOfWeek - $todayDow + 7) % 7;
            $candidate = $today->copy()->addDays($delta);
            $slotStart = self::extractTimeFromValue($slot->start_time);
            $candidateDateTime = Carbon::parse($candidate->format('Y-m-d') . ' ' . $slotStart);

            if ($candidateDateTime->lessThanOrEqualTo(now())) {
                $candidate->addDays(7);
            }

            return $candidate->format('Y-m-d');
        }

        return Carbon::today()->format('Y-m-d');
    }

    /**
     * Extract time portion (HH:MM:SS) from various formats.
     */
    private static function extractTimeFromValue($timeValue): string
    {
        if ($timeValue instanceof Carbon) {
            return $timeValue->format('H:i:s');
        }

        $timeStr = (string) $timeValue;

        if (strpos($timeStr, ' ') !== false) {
            $parts = explode(' ', $timeStr);
            return end($parts);
        }

        if (strpos($timeStr, '.') !== false) {
            $parts = explode('.', $timeStr);
            return $parts[0];
        }

        return $timeStr ?: '00:00:00';
    }
}
