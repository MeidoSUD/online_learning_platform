<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI Assistant Configuration
    |--------------------------------------------------------------------------
    */

    // OpenAI model used for chat completions
    'model' => env('AI_MODEL', 'gpt-4o-mini'),

    // Max number of user messages a user can send per day
    'daily_limit' => (int) env('AI_DAILY_LIMIT', 50),

    // How many past messages to include as context for the model
    'history_messages' => (int) env('AI_HISTORY_MESSAGES', 20),

    // Max length of a single user message
    'message_max_length' => (int) env('AI_MESSAGE_MAX_LENGTH', 4000),

    // Temperature (creativity) for chat completions
    'temperature' => (float) env('AI_TEMPERATURE', 0.7),

];
