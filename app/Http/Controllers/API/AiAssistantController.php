<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use OpenAI\Laravel\Facades\OpenAI;
use Throwable;

class AiAssistantController extends Controller
{
    /**
     * System prompt that keeps the assistant focused on education.
     */
    protected function systemPrompt(): string
    {
        return "You are \"Ewan Genius AI\", an educational assistant for students on the Ewan Genius online learning platform. "
            . "You help with private lessons in subjects like Mathematics, Arabic, English, Science, and other school subjects (Saudi curriculum).\n"
            . "Rules:\n"
            . "1. Answer in the same language the student uses (Arabic or English).\n"
            . "2. Explain concepts step by step and guide the student to understand, instead of just giving the final answer.\n"
            . "3. Be friendly, encouraging, and appropriate for school-age students.\n"
            . "4. If asked anything unrelated to education or inappropriate, politely redirect back to learning.\n"
            . "5. Keep answers clear, concise, and structured.";
    }

    /**
     * POST /api/ai/assistant
     * Send a message and get the AI assistant's reply.
     */
    public function send(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:' . config('ai.message_max_length', 4000),
        ]);

        $user = $request->user();
        $message = trim($request->input('message'));

        if ($message === '') {
            return response()->json(['success' => false, 'message' => 'Message cannot be empty'], 422);
        }

        // Enforce daily limit
        $limit = config('ai.daily_limit', 50);
        $todayCount = ChatMessage::where('user_id', $user->id)
            ->where('role', 'user')
            ->whereDate('created_at', now()->toDateString())
            ->count();

        if ($todayCount >= $limit) {
            return response()->json([
                'success' => false,
                'message' => "You've reached the daily message limit ({$limit}). Try again tomorrow.",
            ], 429);
        }

        // Persist the user's message first so it's never lost
        $userMessage = ChatMessage::create([
            'user_id' => $user->id,
            'role'    => 'user',
            'content' => $message,
        ]);

        $startedAt = microtime(true);

        try {
            $history = $this->buildHistory($user->id, config('ai.history_messages', 20));

            $result = OpenAI::chat()->create([
                'model'       => config('ai.model', 'gpt-4o-mini'),
                'messages'    => [
                    ['role' => 'system', 'content' => $this->systemPrompt()],
                    ...$history,
                    ['role' => 'user', 'content' => $message],
                ],
                'temperature' => config('ai.temperature', 0.7),
            ]);

            $reply = $result->choices[0]->message->content ?? '';
            $model = $result->model ?? null;
            $usage = $result->usage ?? null;

            $assistantMessage = ChatMessage::create([
                'user_id'     => $user->id,
                'role'        => 'assistant',
                'content'     => $reply,
                'model'       => $model,
                'tokens_used' => $usage->totalTokens ?? null,
                'metadata'    => [
                    'prompt_tokens'     => $usage->promptTokens ?? null,
                    'completion_tokens' => $usage->completionTokens ?? null,
                    'latency_ms'        => (int) round((microtime(true) - $startedAt) * 1000),
                ],
            ]);

            return response()->json([
                'success' => true,
                'data'    => [
                    'id'      => $assistantMessage->id,
                    'reply'   => $reply,
                    'model'   => $model,
                    'created_at' => $assistantMessage->created_at,
                ],
            ]);
        } catch (Throwable $e) {
            Log::error('AI assistant request failed', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Sorry, the AI assistant is temporarily unavailable. Please try again in a moment.',
            ], 500);
        }
    }

    /**
     * GET /api/ai/assistant/history
     * Return the authenticated user's conversation history (newest first).
     */
    public function history(Request $request): JsonResponse
    {
        $messages = ChatMessage::where('user_id', $request->user()->id)
            ->orderByDesc('id')
            ->limit(200)
            ->get()
            ->map(fn (ChatMessage $m) => [
                'id'         => (string) $m->id,
                'role'       => $m->role,
                'content'    => $m->content,
                'created_at' => $m->created_at,
            ]);

        return response()->json([
            'success' => true,
            'data'    => $messages,
        ]);
    }

    /**
     * DELETE /api/ai/assistant
     * Clear the authenticated user's chat history.
     */
    public function clear(Request $request): JsonResponse
    {
        ChatMessage::where('user_id', $request->user()->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Chat history cleared',
        ]);
    }

    /**
     * Load recent user/assistant messages to give the model context.
     */
    protected function buildHistory(int $userId, int $maxMessages): array
    {
        $messages = ChatMessage::where('user_id', $userId)
            ->whereIn('role', ['user', 'assistant'])
            ->orderByDesc('id')
            ->limit($maxMessages)
            ->get()
            ->reverse();

        return $messages->map(fn (ChatMessage $m) => [
            'role'    => $m->role,
            'content' => $m->content,
        ])->values()->toArray();
    }
}
