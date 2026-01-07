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

            Log::info('New support contact submission', [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'subject' => $validated['subject'],
            ]);

            // Send email to support team
            try {
                Mail::raw(
                    "New Support Request from: {$validated['name']}\n" .
                    "Email: {$validated['email']}\n\n" .
                    "Subject: {$validated['subject']}\n\n" .
                    "Message:\n{$validated['message']}",
                    function ($message) use ($validated) {
                        $message->to('contact@ewan-geniuses.com')
                                ->from($validated['email'])
                                ->subject("Support Request: {$validated['subject']}")
                                ->replyTo($validated['email']);
                    }
                );

                Log::info('Support email sent successfully to contact@ewan-geniuses.com');
            } catch (\Exception $e) {
                Log::warning('Failed to send support email: ' . $e->getMessage());
                // Don't fail the response, just log it
            }

            return response()->json([
                'success' => true,
                'message' => 'Thank you! Your message has been sent successfully. We will get back to you soon.'
            ], 200);

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
