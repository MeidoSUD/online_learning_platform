<?php

namespace Tests\Feature;

use App\Http\Controllers\API\Admin\ServiceAdminController;
use App\Models\Services;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ServiceAdminControllerTest extends TestCase
{
    use DatabaseTransactions;

    public function test_update_accepts_empty_optional_strings_for_existing_service(): void
    {
        $service = Services::create([
            'key_name' => 'private-lessons',
            'name_en' => 'Private Lessons',
            'name_ar' => 'دروس خاصة',
            'description_en' => 'Original description',
            'description_ar' => 'وصف أصلي',
            'image' => 'https://example.com/image.png',
            'status' => 1,
            'role_id' => 3,
        ]);

        $request = Request::create('/api/admin/services/' . $service->id, 'POST', [
            'name_en' => '',
            'name_ar' => '',
            'description_en' => '',
            'description_ar' => '',
            'role_id' => '3',
            'status' => '1',
        ]);

        $controller = new ServiceAdminController();
        $response = $controller->update($request, $service->id);

        $this->assertSame(200, $response->getStatusCode());

        $payload = json_decode($response->getContent(), true);
        $this->assertTrue($payload['success']);
        $this->assertSame('Service updated successfully', $payload['message']);
    }

    public function test_update_accepts_uploaded_icon_for_existing_service(): void
    {
        Storage::fake('public');

        $service = Services::create([
            'key_name' => 'private-lessons',
            'name_en' => 'Private Lessons',
            'name_ar' => 'دروس خاصة',
            'description_en' => 'Original description',
            'description_ar' => 'وصف أصلي',
            'image' => 'https://example.com/image.png',
            'status' => 1,
            'role_id' => 3,
        ]);

        $file = UploadedFile::fake()->image('icon.png', 120, 120);

        $request = Request::create('/api/admin/services/' . $service->id, 'POST', [
            'name_en' => 'Updated Service',
            'name_ar' => 'خدمة محدثة',
            'role_id' => '3',
            'status' => '1',
        ], [], ['icon' => $file], []);

        $controller = new ServiceAdminController();
        $response = $controller->update($request, $service->id);

        $this->assertSame(200, $response->getStatusCode());

        $payload = json_decode($response->getContent(), true);
        $this->assertTrue($payload['success']);
        $this->assertSame('Service updated successfully', $payload['message']);
        $this->assertStringContainsString('storage/services/', $payload['data']['image']);
    }
}
