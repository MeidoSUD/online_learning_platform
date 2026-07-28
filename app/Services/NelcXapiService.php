<?php

namespace App\Services;

use App\Models\User;
use App\Models\Booking;
use App\Models\SystemLog;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class NelcXapiService
{
    protected Client $client;
    protected string $endpoint;
    protected string $platformUrl;
    protected string $platformAr;
    protected string $platformEn;

    public function __construct()
    {
        $this->endpoint   = config('lrs-nelc-xapi.endpoint');
        $this->platformUrl = config('lrs-nelc-xapi.platform');
        $this->platformAr  = config('lrs-nelc-xapi.platform_in_arabic');
        $this->platformEn  = config('lrs-nelc-xapi.platform_in_english');

        $this->client = new Client([
            'auth' => [
                config('lrs-nelc-xapi.key'),
                config('lrs-nelc-xapi.secret'),
            ],
        ]);
    }

    // ─── Shared xAPI building blocks ────────────────────────────────

    protected function actorArray(User $student): array
    {
        $nationalId = $student->notional_id ?? $student->phone_number ?? '';

        return [
            'mbox'      => 'mailto:' . ($student->email ?? 'student@example.com'),
            'name'      => strval($nationalId),
            'objectType'=> 'Agent',
        ];
    }

    protected function contextArray(Booking $booking, bool $withExtensions = true): array
    {
        $teacher = $booking->teacher;

        $ctx = [
            'instructor' => [
                'name'      => $teacher ? ($teacher->first_name . ' ' . $teacher->last_name) : 'Instructor',
                'mbox'      => 'mailto:' . ($teacher->email ?? 'instructor@example.com'),
                'objectType'=> 'Agent',
            ],
            'platform'  => $this->platformUrl,
            'language'  => 'ar-SA',
        ];

        if ($withExtensions) {
            $ctx['extensions'] = [
                'https://nelc.gov.sa/extensions/platform' => [
                    'name' => [
                        'ar-SA' => $this->platformAr,
                        'en-US' => $this->platformEn,
                    ],
                ],
            ];
        }

        return $ctx;
    }

    protected function courseObjectArray(Booking $booking): array
    {
        $teacher = $booking->teacher;
        $subject = $booking->subject;
        $service = $booking->service;

        $teacherName = $teacher ? ($teacher->first_name . ' ' . $teacher->last_name) : 'Instructor';
        $subjectName = $subject ? ($subject->name_en ?? $subject->name_ar ?? '') : '';
        $serviceName = $service ? ($service->name_en ?? $service->name_ar ?? '') : '';

        $name = $teacherName;
        if ($subjectName) $name .= ' - ' . $subjectName;
        elseif ($serviceName) $name .= ' - ' . $serviceName;

        $desc = 'Private lesson with ' . $teacherName;
        if ($subjectName) $desc .= ' — ' . $subjectName;

        return [
            'id' => $this->platformUrl . '/booking/' . $booking->booking_reference,
            'definition' => [
                'name'        => ['en-US' => $name],
                'description' => ['en-US' => $desc],
                'type'        => 'https://w3id.org/xapi/cmi5/activitytype/course',
            ],
            'objectType' => 'Activity',
        ];
    }

    protected function timestamp(): string
    {
        return gmdate('Y-m-d\TH:i:s') . 'Z';
    }

    // ─── Send to LRS ───────────────────────────────────────────────

    protected function sendStatement(array $statement): array
    {
        try {
            $response = $this->client->post($this->endpoint, [
                'headers' => [
                    'Content-Type'             => 'application/json',
                    'X-Experience-API-Version' => '1.0.3',
                ],
                'json' => $statement,
            ]);

            $body = $response->getBody()->getContents();

            return [
                'success' => true,
                'status'  => $response->getStatusCode(),
                'body'    => $body,
            ];
        } catch (\Throwable $e) {
            $status = 0;
            $body   = '';
            if ($e->getResponse()) {
                $status = $e->getResponse()->getStatusCode();
                $body   = $e->getResponse()->getBody()->getContents();
            }

            return [
                'success' => false,
                'status'  => $status,
                'body'    => $body,
                'error'   => $e->getMessage(),
            ];
        }
    }

    // ─── Logging ───────────────────────────────────────────────────

    protected function logToSystem(string $verb, int $studentId, ?int $bookingId, array $payload, array $response): void
    {
        try {
            $isSuccess = $response['success'] ?? false;
            $status    = $response['status'] ?? 0;

            SystemLog::create([
                'level'   => $isSuccess ? 'info' : 'error',
                'type'    => 'nelc_xapi',
                'title'   => "NELC xAPI: {$verb}",
                'message' => ($isSuccess ? "SUCCESS (HTTPS {$status})" : "FAILED (HTTPS {$status})") . "\n" . ($response['error'] ?? $response['body'] ?? ''),
                'context' => [
                    'verb'       => $verb,
                    'student_id' => $studentId,
                    'booking_id' => $bookingId,
                    'http_status'=> $status,
                    'lrs_response' => $response['body'] ?? '',
                    'xapi_payload'=> $payload,
                ],
                'hash' => md5("nelc_{$verb}_{$studentId}_{$bookingId}_" . now()->timestamp),
                'occurrences' => 1,
                'last_occurred_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('NELC xAPI: failed to write to system_logs', ['error' => $e->getMessage()]);
        }
    }

    protected function logErrorToSystem(string $verb, int $studentId, ?int $bookingId, \Throwable $e): void
    {
        try {
            SystemLog::create([
                'level'   => 'error',
                'type'    => 'nelc_xapi',
                'title'   => "NELC xAPI: {$verb} — EXCEPTION",
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
                'trace'   => $e->getTraceAsString(),
                'context' => [
                    'verb'       => $verb,
                    'student_id' => $studentId,
                    'booking_id' => $bookingId,
                ],
                'hash' => md5("nelc_{$verb}_exception_{$studentId}_{$bookingId}_" . now()->timestamp),
                'occurrences' => 1,
                'last_occurred_at' => now(),
            ]);
        } catch (\Throwable $inner) {
            Log::warning('NELC xAPI: failed to write exception to system_logs', ['error' => $inner->getMessage()]);
        }
    }

    // ─── Public verb methods ───────────────────────────────────────

    /**
     * 1. Student registers for a private lesson package.
     * Fires when the booking status changes to confirmed.
     */
    public function registered(User $student, Booking $booking): void
    {
        $verb = 'registered';
        try {
            $statement = [
                'actor'   => $this->actorArray($student),
                'verb'    => [
                    'id'      => 'http://adlnet.gov/expapi/verbs/registered',
                    'display'=> ['en-US' => 'registered'],
                ],
                'object'  => $this->courseObjectArray($booking),
                'context' => array_merge($this->contextArray($booking, true), [
                    'extensions' => array_merge(
                        $this->contextArray($booking, true)['extensions'] ?? [],
                        [
                            'https://nelc.gov.sa/extensions/duration'  => 'PT' . ($booking->sessions_count * 30) . 'M0S',
                            'https://nelc.gov.sa/extensions/lms_url'   => $this->platformUrl,
                            'https://nelc.gov.sa/extensions/program_url'=> $this->platformUrl . '/booking/' . $booking->booking_reference,
                        ]
                    ),
                ]),
                'timestamp' => $this->timestamp(),
            ];

            $response = $this->sendStatement($statement);
            $this->logToSystem($verb, $student->id, $booking->id, $statement, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem($verb, $student->id, $booking->id, $e);
        }
    }

    /**
     * 2. Learning session initialized (teacher starts first session).
     */
    public function initialized(User $student, Booking $booking): void
    {
        $verb = 'initialized';
        try {
            $statement = [
                'actor'   => $this->actorArray($student),
                'verb'    => [
                    'id'      => 'http://adlnet.gov/expapi/verbs/initialized',
                    'display'=> ['en-US' => 'initialized'],
                ],
                'object'  => $this->courseObjectArray($booking),
                'context' => $this->contextArray($booking, true),
                'timestamp' => $this->timestamp(),
            ];

            $response = $this->sendStatement($statement);
            $this->logToSystem($verb, $student->id, $booking->id, $statement, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem($verb, $student->id, $booking->id, $e);
        }
    }

    /**
     * 3. Student attended / watched a private lesson session.
     * Fires each time the teacher ends a session.
     */
    public function attended(User $student, Booking $booking, string $sessionUrl, string $sessionName, string $duration): void
    {
        $verb = 'attended';
        try {
            $statement = [
                'actor'   => $this->actorArray($student),
                'verb'    => [
                    'id'      => 'https://w3id.org/xapi/acrossx/verbs/watched',
                    'display'=> ['en-US' => 'watched'],
                ],
                'object'  => [
                    'id' => $sessionUrl,
                    'definition' => [
                        'name'        => ['en-US' => $sessionName],
                        'description' => ['en-US' => 'Private lesson session'],
                        'type'        => 'https://w3id.org/xapi/video/activity-type/video',
                    ],
                    'objectType' => 'Activity',
                ],
                'context' => array_merge($this->contextArray($booking, true), [
                    'contextActivities' => [
                        'parent' => [
                            [
                                'id'          => $this->platformUrl . '/booking/' . $booking->booking_reference,
                                'definition'  => $this->courseObjectArray($booking)['definition'],
                                'objectType'  => 'Activity',
                            ],
                        ],
                    ],
                ]),
                'result' => [
                    'completion' => true,
                    'duration'   => $duration,
                ],
                'timestamp' => $this->timestamp(),
            ];

            $response = $this->sendStatement($statement);
            $this->logToSystem($verb, $student->id, $booking->id, $statement, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem($verb, $student->id, $booking->id, $e);
        }
    }

    /**
     * 4. Lesson completed (per session).
     * Fires alongside attended when teacher ends a session.
     */
    public function completedLesson(User $student, Booking $booking, string $sessionUrl, string $sessionName, string $duration): void
    {
        $verb = 'completedLesson';
        try {
            $statement = [
                'actor'   => $this->actorArray($student),
                'verb'    => [
                    'id'      => 'http://adlnet.gov/expapi/verbs/completed',
                    'display'=> ['en-US' => 'completed'],
                ],
                'object'  => [
                    'id' => $sessionUrl,
                    'definition' => [
                        'name'        => ['en-US' => $sessionName],
                        'description' => ['en-US' => 'Private lesson session'],
                        'type'        => 'http://adlnet.gov/expapi/activities/lesson',
                    ],
                    'objectType' => 'Activity',
                ],
                'context' => array_merge($this->contextArray($booking, true), [
                    'contextActivities' => [
                        'parent' => [
                            [
                                'id'          => $this->platformUrl . '/booking/' . $booking->booking_reference,
                                'definition'  => $this->courseObjectArray($booking)['definition'],
                                'objectType'  => 'Activity',
                            ],
                        ],
                    ],
                ]),
                'result' => [
                    'duration' => $duration,
                ],
                'timestamp' => $this->timestamp(),
            ];

            $response = $this->sendStatement($statement);
            $this->logToSystem($verb, $student->id, $booking->id, $statement, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem($verb, $student->id, $booking->id, $e);
        }
    }

    /**
     * 5. Progress through the private lesson package.
     * Fires on each session completion with updated progress.
     */
    public function progressed(User $student, Booking $booking, float $scaled, bool $completion = false): void
    {
        $verb = 'progressed';
        try {
            $statement = [
                'actor'   => $this->actorArray($student),
                'verb'    => [
                    'id'      => 'http://adlnet.gov/expapi/verbs/progressed',
                    'display'=> ['en-US' => 'progressed'],
                ],
                'object'  => $this->courseObjectArray($booking),
                'context' => $this->contextArray($booking, true),
                'result'  => [
                    'score'      => ['scaled' => $scaled],
                    'completion' => $completion,
                ],
                'timestamp' => $this->timestamp(),
            ];

            $response = $this->sendStatement($statement);
            $this->logToSystem($verb, $student->id, $booking->id, $statement, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem($verb, $student->id, $booking->id, $e);
        }
    }

    /**
     * 5. All sessions in the private lesson package are completed.
     */
    public function completedCourse(User $student, Booking $booking): void
    {
        $verb = 'completed';
        try {
            $statement = [
                'actor'   => $this->actorArray($student),
                'verb'    => [
                    'id'      => 'http://adlnet.gov/expapi/verbs/completed',
                    'display'=> ['en-US' => 'completed'],
                ],
                'object'  => $this->courseObjectArray($booking),
                'context' => $this->contextArray($booking, true),
                'timestamp' => $this->timestamp(),
            ];

            $response = $this->sendStatement($statement);
            $this->logToSystem($verb, $student->id, $booking->id, $statement, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem($verb, $student->id, $booking->id, $e);
        }
    }

    /**
     * 6. Student rates the teacher after a private lesson.
     */
    public function rated(User $student, Booking $booking, float $scaled, float $raw, string $comment = ''): void
    {
        $verb = 'rated';
        try {
            $statement = [
                'actor'   => $this->actorArray($student),
                'verb'    => [
                    'id'      => 'http://id.tincanapi.com/verb/rated',
                    'display'=> ['en-US' => 'rated'],
                ],
                'object'  => $this->courseObjectArray($booking),
                'context' => $this->contextArray($booking, true),
                'result'  => [
                    'score' => [
                        'scaled'=> $scaled,
                        'raw'   => $raw,
                        'min'   => 0,
                        'max'   => 5,
                    ],
                    'response' => $comment,
                ],
                'timestamp' => $this->timestamp(),
            ];

            $response = $this->sendStatement($statement);
            $this->logToSystem($verb, $student->id, $booking->id, $statement, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem($verb, $student->id, $booking->id, $e);
        }
    }

    /**
     * 7. Admin issues a certificate — the final "earned" statement.
     */
    public function earned(User $student, Booking $booking, string $certUrl, string $certNumber): void
    {
        $verb = 'earned';
        try {
            $path = parse_url($certUrl, PHP_URL_PATH);
            $uuid = basename($path);
            $certId = $this->platformUrl . '/certificate/' . $uuid;

            $statement = [
                'actor'   => $this->actorArray($student),
                'verb'    => [
                    'id'      => 'http://id.tincanapi.com/verb/earned',
                    'display'=> ['en-US' => 'earned'],
                ],
                'object'  => [
                    'id' => $certId,
                    'definition' => [
                        'name' => ['en-US' => $certNumber],
                        'type' => 'https://www.opigno.org/en/tincan_registry/activity_type/certificate',
                    ],
                    'objectType' => 'Activity',
                ],
                'context' => array_merge($this->contextArray($booking, false), [
                    'extensions' => [
                        'http://id.tincanapi.com/extension/jws-certificate-location' => $certUrl,
                        'https://nelc.gov.sa/extensions/platform' => [
                            'name' => [
                                'ar-SA' => $this->platformAr,
                                'en-US' => $this->platformEn,
                            ],
                        ],
                    ],
                    'contextActivities' => [
                        'parent' => [
                            [
                                'id'          => $this->platformUrl . '/booking/' . $booking->booking_reference,
                                'definition'  => $this->courseObjectArray($booking)['definition'],
                                'objectType'  => 'Activity',
                            ],
                        ],
                    ],
                ]),
                'timestamp' => $this->timestamp(),
            ];

            $response = $this->sendStatement($statement);
            $this->logToSystem($verb, $student->id, $booking->id, $statement, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem($verb, $student->id, $booking->id, $e);
        }
    }
}
