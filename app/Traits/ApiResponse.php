<?php

namespace App\Traits;

use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Exception;
use Throwable;

/**
 * Trait for handling API exceptions with consistent error responses
 * 
 * Usage in controller:
 *   use ApiResponse;
 *   
 *   public function someMethod() {
 *       try {
 *           // your code
 *       } catch (ValidationException $e) {
 *           return $this->validationError($e);
 *       } catch (AuthenticationException $e) {
 *           return $this->authError('Invalid credentials');
 *       } catch (Exception $e) {
 *           return $this->serverError($e);
 *       }
 *   }
 */
trait ApiResponse
{
    /**
     * Validation error response
     * Used for field validation errors (422)
     */
    protected function validationError(ValidationException $e, $message = 'Validation failed')
    {
        return response()->json([
            'success' => false,
            'code' => 'VALIDATION_ERROR',
            'message' => $message,
            'errors' => $e->errors(),
            'status' => 422
        ], 422);
    }

    /**
     * Generic validation error with manual errors array
     */
    protected function validationErrorArray(array $errors, $message = 'Validation failed')
    {
        return response()->json([
            'success' => false,
            'code' => 'VALIDATION_ERROR',
            'message' => $message,
            'errors' => $errors,
            'status' => 422
        ], 422);
    }

    /**
     * Authentication error response (401)
     * Used when user not authenticated or invalid credentials
     */
    protected function authError($message = 'Authentication failed')
    {
        return response()->json([
            'success' => false,
            'code' => 'AUTHENTICATION_ERROR',
            'message' => $message,
            'status' => 401
        ], 401);
    }

    /**
     * Authorization error response (403)
     * Used when user authenticated but not authorized for action
     */
    protected function authorizationError($message = 'You do not have permission to perform this action')
    {
        return response()->json([
            'success' => false,
            'code' => 'AUTHORIZATION_ERROR',
            'message' => $message,
            'status' => 403
        ], 403);
    }

    /**
     * Not found error response (404)
     * Used when resource not found
     */
    protected function notFoundError($message = 'Resource not found')
    {
        return response()->json([
            'success' => false,
            'code' => 'NOT_FOUND',
            'message' => $message,
            'status' => 404
        ], 404);
    }

    /**
     * Conflict error response (409)
     * Used for duplicate records, unique constraint violations
     */
    protected function conflictError($message = 'Resource already exists', $field = null)
    {
        $response = [
            'success' => false,
            'code' => 'CONFLICT',
            'message' => $message,
            'status' => 409
        ];

        if ($field) {
            $response['field'] = $field;
        }

        return response()->json($response, 409);
    }

    /**
     * Database error response (500)
     * Used for query exceptions and database errors
     */
    protected function databaseError(Exception $e, $message = 'Database error occurred')
    {
        Log::error('Database Error: ' . $e->getMessage(), [
            'exception' => get_class($e),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);

        return response()->json([
            'success' => false,
            'code' => 'DATABASE_ERROR',
            'message' => $message,
            'status' => 500
        ], 500);
    }

    /**
     * Server error response (500)
     * Used for general exceptions
     */
    protected function serverError(Exception $e, $message = 'An error occurred. Please try again later.')
    {
        Log::error('Server Error: ' . $e->getMessage(), [
            'exception' => get_class($e),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ]);

        return response()->json([
            'success' => false,
            'code' => 'SERVER_ERROR',
            'message' => $message,
            'status' => 500
        ], 500);
    }

    /**
     * Network/Timeout error response (503)
     * Used for external service failures
     */
    protected function networkError($message = 'Network error. Please check your connection and try again.')
    {
        return response()->json([
            'success' => false,
            'code' => 'NETWORK_ERROR',
            'message' => $message,
            'status' => 503
        ], 503);
    }

    /**
     * Success response with data
     */
    protected function success($data = null, $message = 'Operation successful', $code = 200)
    {
        $response = [
            'success' => true,
            'code' => 'SUCCESS',
            'message' => $message,
            'status' => $code
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $code);
    }

    /**
     * Created response (201)
     */
    protected function created($data = null, $message = 'Resource created successfully')
    {
        $response = [
            'success' => true,
            'code' => 'CREATED',
            'message' => $message,
            'status' => 201
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, 201);
    }

    /**
     * Generic error handler that detects exception type
     * Use this for a catch-all in try-catch blocks
     */
    protected function handleException(Throwable $e, $defaultMessage = 'An error occurred')
    {
        // Validation exception
        if ($e instanceof ValidationException) {
            return $this->validationError($e);
        }

        // Authentication exception
        if ($e instanceof AuthenticationException) {
            return $this->authError('Authentication failed. Please login again.');
        }

        // Authorization exception
        if ($e instanceof AuthorizationException) {
            return $this->authorizationError();
        }

        // Database exception
        if ($e instanceof QueryException) {
            return $this->databaseError($e);
        }

        // Generic exception
        return $this->serverError($e, $defaultMessage);
    }

    /**
     * Validate request and return errors if validation fails
     * Returns null if validation passes, error response if fails
     */
    protected function validateRequest(Request $request, array $rules, array $messages = [])
    {
        try {
            $request->validate($rules, $messages);
            return null; // Validation passed
        } catch (ValidationException $e) {
            return $this->validationError($e);
        }
    }
}
