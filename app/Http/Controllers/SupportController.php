<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SupportController extends Controller
{
    /**
     * Show contact support page
     * 
     * @return \Illuminate\View\View
     */
    public function contact()
    {
        return view('support.contact');
    }

    /**
     * Submit contact form (public endpoint)
     * Saves ticket to database and optionally sends email
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function submitContact(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|min:2|max:255',
                'email' => 'required|email|max:255',
                'subject' => 'required|string|min:3|max:255',
                'message' => 'required|string|min:10|max:5000',
            ]);

            // Create support ticket in database
            $ticket = SupportTicket::create([
                'user_id' => null, // Public submission, no user account
                'subject' => $validated['subject'],
                'body' => $validated['message'],
                'status' => 'open', // New tickets start as open
                'internal_note' => "Public contact from: {$validated['name']} ({$validated['email']})",
            ]);

            Log::info('New support ticket created', [
                'ticket_id' => $ticket->id,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'subject' => $validated['subject'],
            ]);

            // Send email notification to support team (optional, doesn't fail if fails)
            try {
                Mail::raw(
                    "New Support Request from: {$validated['name']}\n" .
                    "Email: {$validated['email']}\n" .
                    "Ticket ID: {$ticket->id}\n\n" .
                    "Subject: {$validated['subject']}\n\n" .
                    "Message:\n{$validated['message']}\n\n" .
                    "View in admin panel: /api/admin/support-tickets/{$ticket->id}",
                    function ($message) use ($validated) {
                        $message->to('contact@ewan-geniuses.com')
                                ->from($validated['email'])
                                ->subject("Support Request: {$validated['subject']}")
                                ->replyTo($validated['email']);
                    }
                );

                Log::info('Support email sent successfully', [
                    'ticket_id' => $ticket->id,
                    'email' => 'contact@ewan-geniuses.com'
                ]);
            } catch (\Exception $e) {
                Log::warning('Failed to send support email', [
                    'ticket_id' => $ticket->id,
                    'error' => $e->getMessage()
                ]);
                // Don't fail the response - ticket is saved in database
            }

            return response()->json([
                'success' => true,
                'message' => 'Thank you! Your message has been saved. We will get back to you soon.',
                'ticket_id' => $ticket->id
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Support form validation failed', ['errors' => $e->errors()]);
            
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Support form submission error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred. Please try again later.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
