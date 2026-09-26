<?php

namespace App\Services\User;

use App\Models\User;
use App\Models\Attachment;
use App\Models\TeacherInstitute;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UserAttachmentService
{
    /**
     * Handle file upload for user.
     */
    public function handleFileUpload(Request $request, string $key, string $folder, User $user): ?string
    {
        if (!$request->hasFile($key)) {
            return null;
        }

        $file = $request->file($key);
        $path = $file->store($folder, 'public');

        $attachment = Attachment::create([
            'user_id' => $user->id,
            'file_path' => asset('storage/' . $path),
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $file->getClientMimeType(),
        ]);

        return $attachment->file_path;
    }

    /**
     * Save attachment file with specific attached_to_type.
     */
    public function saveAttachmentFile(Request $request, string $key, string $folder, User $user, string $attachedToType): ?string
    {
        if (!$request->hasFile($key)) {
            return null;
        }

        try {
            $file = $request->file($key);
            $path = $file->store($folder, 'public');
            $fileUrl = asset('storage/' . $path);

            $attachment = Attachment::create([
                'user_id' => $user->id,
                'file_path' => $fileUrl,
                'file_name' => $file->getClientOriginalName(),
                'file_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
                'attached_to_type' => $attachedToType,
            ]);

            Log::info('File uploaded and attachment created', [
                'user_id' => $user->id,
                'file_name' => $file->getClientOriginalName(),
                'attachment_id' => $attachment->id,
                'file_path' => $fileUrl,
            ]);

            return $fileUrl;
        } catch (\Exception $e) {
            Log::error('Failed to upload file', [
                'user_id' => $user->id,
                'key' => $key,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Save institute attachment.
     */
    public function saveInstituteAttachment(Request $request, string $fieldName, string $path, TeacherInstitute $institute, string $attachmentType): void
    {
        if (!$request->hasFile($fieldName)) {
            return;
        }

        try {
            $oldAttachment = Attachment::where('user_id', $institute->user_id)
                ->where('attached_to_type', $attachmentType)
                ->where('attached_to_id', $institute->id)
                ->first();

            if ($oldAttachment && Storage::exists($oldAttachment->file_path)) {
                Storage::delete($oldAttachment->file_path);
            }

            $file = $request->file($fieldName);
            $filePath = $file->store($path, 'public');

            Attachment::updateOrCreate(
                [
                    'user_id' => $institute->user_id,
                    'attached_to_type' => $attachmentType,
                    'attached_to_id' => $institute->id,
                ],
                [
                    'file_path' => $filePath,
                ]
            );

            if ($attachmentType === 'cover_image') {
                $institute->update(['cover_image' => $filePath]);
            } elseif ($attachmentType === 'intro_video') {
                $institute->update(['intro_video' => $filePath]);
            }

            Log::info("Institute $attachmentType uploaded", [
                'user_id' => $institute->user_id,
                'path' => $filePath,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to upload institute $attachmentType: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Save user attachment (individual teacher).
     */
    public function saveUserAttachment(Request $request, string $fieldName, string $path, User $user, string $attachmentType): void
    {
        if (!$request->hasFile($fieldName)) {
            return;
        }

        try {
            $file = $request->file($fieldName);
            Log::info("[intro_video] saveUserAttachment start", [
                'user_id' => $user->id,
                'field' => $fieldName,
                'orig_name' => $file ? $file->getClientOriginalName() : null,
                'mime' => $file ? $file->getClientMimeType() : null,
                'size' => $file ? $file->getSize() : null,
            ]);

            $oldAttachment = Attachment::where('user_id', $user->id)
                ->where('attached_to_type', $attachmentType)
                ->first();

            if ($oldAttachment) {
                $oldExists = Storage::disk('public')->exists($oldAttachment->file_path);
                if ($oldExists) {
                    Storage::disk('public')->delete($oldAttachment->file_path);
                }
            }

            $filePath = $file->store($path, 'public');

            $record = Attachment::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'attached_to_type' => $attachmentType,
                    'attached_to_id' => $user->id,
                ],
                [
                    'file_path' => $filePath,
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $file->getClientMimeType(),
                    'file_size' => $file->getSize(),
                    'created_by' => $user->id,
                ]
            );

            Log::info("User $attachmentType uploaded", [
                'user_id' => $user->id,
                'path' => $filePath,
                'attachment_id' => $record->id,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to upload user $attachmentType: " . $e->getMessage(), [
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Delete attachment by ID.
     */
    public function deleteAttachment(Request $request, $id): array
    {
        $user = $request->user();

        $attachment = Attachment::where('id', $id)->first();
        if (!$attachment) {
            return ['success' => false, 'status_code' => 404, 'message' => 'Attachment not found'];
        }

        if ($attachment->user_id != $user->id && !optional($user->role)->name_key === 'admin') {
            return ['success' => false, 'status_code' => 403, 'message' => 'Not authorized to delete this attachment'];
        }

        try {
            if (Storage::exists($attachment->file_path)) {
                Storage::delete($attachment->file_path);
            }
        } catch (\Exception $e) {
            Log::warning('Attachment file deletion from storage failed', ['error' => $e->getMessage()]);
        }

        $attachment->delete();

        return ['success' => true, 'status_code' => 200, 'message' => 'Attachment deleted successfully'];
    }
}
