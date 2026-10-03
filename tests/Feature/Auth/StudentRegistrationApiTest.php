<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class StudentRegistrationApiTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    /**
     * Test student registration without password (OTP based)
     */
    public function test_student_can_register_without_password(): void
    {
        $uniqueEmail = 'student_no_pw_' . uniqid() . '@example.com';

        $response = $this->postJson('/api/auth/register-student', [
            'first_name' => 'Sara',
            'last_name' => 'Testing',
            'email' => $uniqueEmail,
            'appsflyer_id' => '1790548632734-1902321',
            'platform' => 'ios',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'code' => 'REGISTRATION_SUCCESS',
                'user' => [
                    'email' => $uniqueEmail,
                ]
            ]);

        $this->assertDatabaseHas('users', [
            'email' => $uniqueEmail,
            'role_id' => 4,
        ]);

        $user = User::where('email', $uniqueEmail)->first();
        $this->assertNotNull($user->password);
        $this->assertNotNull($user->verification_code);
    }

    /**
     * Test student registration with email only
     */
    public function test_student_can_register_with_email_only(): void
    {
        $uniqueEmail = 'student_email_only_' . uniqid() . '@example.com';

        $response = $this->postJson('/api/auth/register-student', [
            'first_name' => 'Ahmed',
            'last_name' => 'Ali',
            'email' => $uniqueEmail,
            'phone_number' => null,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'code' => 'REGISTRATION_SUCCESS',
                'user' => [
                    'email' => $uniqueEmail,
                    'phone_number' => null,
                ]
            ]);

        $this->assertDatabaseHas('users', [
            'email' => $uniqueEmail,
            'phone_number' => null,
            'role_id' => 4,
        ]);
    }

    /**
     * Test student registration with phone number only
     */
    public function test_student_can_register_with_phone_only(): void
    {
        $uniquePhone = '05' . rand(10000000, 99999999);

        $response = $this->postJson('/api/auth/register-student', [
            'first_name' => 'Sara',
            'last_name' => 'Mohamed',
            'email' => null,
            'phone_number' => $uniquePhone,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'code' => 'REGISTRATION_SUCCESS',
                'user' => [
                    'email' => null,
                ]
            ]);

        $this->assertDatabaseHas('users', [
            'email' => null,
            'role_id' => 4,
        ]);
    }

    /**
     * Test verification code verification issues Sanctum token
     */
    public function test_verify_code_issues_sanctum_token(): void
    {
        $user = User::create([
            'first_name' => 'Token',
            'last_name' => 'Test',
            'email' => 'tokentest_' . uniqid() . '@example.com',
            'password' => bcrypt('secret'),
            'role_id' => 4,
            'verified' => false,
            'verification_code' => 5555,
        ]);

        $response = $this->postJson('/api/auth/verify', [
            'user_id' => $user->id,
            'code' => '5555',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
                'user',
            ]);

        $this->assertTrue((bool)$user->fresh()->verified);
    }
}
