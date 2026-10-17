<?php

namespace Tests\Feature;

use App\Models\MarketingAnnouncement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MarketingAnnouncementTest extends TestCase
{
    public function test_public_endpoint_returns_targeted_announcements()
    {
        MarketingAnnouncement::query()->forceDelete();

        // Student announcement
        $studentItem = MarketingAnnouncement::create([
            'title' => 'Student Special Workshop',
            'description' => 'Join our IELTS workshop',
            'link_url' => 'https://example.com/workshop',
            'button_text' => 'Register Now',
            'close_button_text' => 'Close',
            'target_role' => 'student',
            'platform' => 'app',
            'is_active' => true,
        ]);

        // Teacher announcement
        $teacherItem = MarketingAnnouncement::create([
            'title' => 'Teacher Certification Event',
            'description' => 'Earn new credentials',
            'link_url' => 'https://example.com/teachers-event',
            'button_text' => 'Join Event',
            'close_button_text' => 'Dismiss',
            'target_role' => 'teacher',
            'platform' => 'both',
            'is_active' => true,
        ]);

        // Both announcement
        $bothItem = MarketingAnnouncement::create([
            'title' => 'Platform Celebration',
            'description' => 'Available for all',
            'link_url' => 'https://example.com/celebration',
            'button_text' => 'View',
            'close_button_text' => 'Later',
            'target_role' => 'both',
            'platform' => 'app',
            'is_active' => true,
        ]);

        // Inactive announcement
        MarketingAnnouncement::create([
            'title' => 'Inactive promo',
            'description' => 'Expired',
            'link_url' => 'https://example.com/expired',
            'button_text' => 'View',
            'close_button_text' => 'Close',
            'target_role' => 'student',
            'platform' => 'app',
            'is_active' => false,
        ]);

        // Query for student on app
        $response = $this->getJson('/api/marketing-announcements/active?platform=app&role=student');
        $response->assertStatus(200);
        $data = $response->json('data.announcements');

        $this->assertCount(2, $data);
        $titles = collect($data)->pluck('title')->toArray();
        $this->assertContains('Student Special Workshop', $titles);
        $this->assertContains('Platform Celebration', $titles);
        $this->assertNotContains('Teacher Certification Event', $titles);
        $this->assertNotContains('Inactive promo', $titles);

        // Track click
        $clickResponse = $this->postJson("/api/marketing-announcements/{$studentItem->id}/click");
        $clickResponse->assertStatus(200);
        $this->assertEquals(1, $studentItem->fresh()->clicks_count);

        // Track view
        $viewResponse = $this->postJson("/api/marketing-announcements/{$studentItem->id}/view");
        $viewResponse->assertStatus(200);
        $this->assertEquals(1, $studentItem->fresh()->views_count);

        // Clean up
        $studentItem->forceDelete();
        $teacherItem->forceDelete();
        $bothItem->forceDelete();
    }
}
