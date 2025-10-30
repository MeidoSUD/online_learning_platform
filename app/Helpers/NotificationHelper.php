<?php
namespace App\Helpers;

use App\Services\NotificationService;
use Illuminate\Support\Facades\Log;

class NotificationHelper
{
    protected static $service;

    protected static function getService(): NotificationService
    {
        if (!self::$service) {
            self::$service = app(NotificationService::class);
        }
        return self::$service;
    }

    // Order Notifications
    public static function orderCreated($teachers, $order): void
    {
        self::getService()->send(
            $teachers,
            'order_created',
            'New Order Available',
            "A new order for {$order->subject->name_en} has been posted.",
            ['order_id' => $order->id]
        );
    }

    public static function applicationReceived($student, $application): void
    {
        self::getService()->send(
            $student,
            'application_received',
            'New Teacher Application',
            "A teacher has applied for your order.",
            [
                'order_id' => $application->order_id,
                'application_id' => $application->id
            ]
        );
    }

    public static function applicationAccepted($teacher, $order, $session): void
    {
        self::getService()->send(
            $teacher,
            'application_accepted',
            'Application Accepted!',
            "Your application has been accepted. Session scheduled for {$session->scheduled_at->format('Y-m-d H:i')}",
            [
                'order_id' => $order->id,
                'session_id' => $session->id
            ]
        );
    }

    public static function applicationRejected($teacher, $order): void
    {
        self::getService()->send(
            $teacher,
            'application_rejected',
            'Application Not Selected',
            "The student has selected another teacher for this order.",
            ['order_id' => $order->id]
        );
    }

    // Payment Notifications
    public static function paymentCompleted($user, $order, $amount): void
    {
        self::getService()->send(
            $user,
            'payment_completed',
            'Payment Successful',
            "Your payment of {$amount} SAR has been completed successfully.",
            ['order_id' => $order->id, 'amount' => $amount]
        );
    }

    public static function paymentFailed($user, $order, $reason): void
    {
        self::getService()->send(
            $user,
            'payment_failed',
            'Payment Failed',
            "Payment failed: {$reason}. Please try again.",
            ['order_id' => $order->id]
        );
    }

    // Session Notifications
    public static function sessionScheduled($users, $session): void
    {
        self::getService()->send(
            $users,
            'session_scheduled',
            'Session Scheduled',
            "Your session is scheduled for {$session->scheduled_at->format('Y-m-d H:i')}",
            ['session_id' => $session->id]
        );
    }

    public static function sessionReminder($users, $session): void
    {
        self::getService()->send(
            $users,
            'session_reminder',
            'Session Starting Soon',
            "Your session starts in 15 minutes. Click to join.",
            [
                'session_id' => $session->id,
                'zoom_url' => $session->zoom_join_url
            ]
        );
    }

    public static function sessionStarted($student, $session): void
    {
        self::getService()->send(
            $student,
            'session_started',
            'Session Started',
            "Your teacher has started the session. Join now!",
            [
                'session_id' => $session->id,
                'zoom_url' => $session->zoom_join_url
            ]
        );
    }

    public static function sessionCompleted($users, $session): void
    {
        self::getService()->send(
            $users,
            'session_completed',
            'Session Completed',
            "Your session has been completed. Please rate your experience.",
            ['session_id' => $session->id]
        );
    }

    // General Notification (Custom)
    public static function custom($user, string $title, string $message, array $data = []): void
    {
        self::getService()->send(
            $user,
            'custom',
            $title,
            $message,
            $data
        );
    }
}
