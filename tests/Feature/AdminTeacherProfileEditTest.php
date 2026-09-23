<?php

namespace Tests\Feature;

use App\Models\Languages;
use App\Models\Role;
use App\Models\Services;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AdminTeacherProfileEditTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (!Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->id();
                $table->string('name_key')->unique();
                $table->string('name_en');
                $table->string('name_ar');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name')->nullable();
                $table->string('first_name')->nullable();
                $table->string('last_name')->nullable();
                $table->string('email')->unique();
                $table->timestamp('email_verified_at')->nullable();
                $table->string('phone_number')->nullable();
                $table->string('nationality')->nullable();
                $table->string('gender')->nullable();
                $table->string('password');
                $table->unsignedBigInteger('role_id')->nullable();
                $table->boolean('is_active')->default(true);
                $table->rememberToken();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('user_profiles')) {
            Schema::create('user_profiles', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->text('bio')->nullable();
                $table->text('description')->nullable();
                $table->boolean('verified')->default(false);
                $table->string('language_pref')->nullable();
                $table->boolean('terms_accepted')->default(false);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('teacher_info')) {
            Schema::create('teacher_info', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('teacher_id');
                $table->text('bio')->nullable();
                $table->boolean('teach_individual')->default(false);
                $table->boolean('package_on_off')->default(false);
                $table->decimal('individual_hour_price', 10, 2)->nullable();
                $table->boolean('teach_group')->default(false);
                $table->decimal('group_hour_price', 10, 2)->nullable();
                $table->integer('max_group_size')->nullable();
                $table->integer('min_group_size')->nullable();
                $table->string('code')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('services')) {
            Schema::create('services', function (Blueprint $table) {
                $table->id();
                $table->string('key_name');
                $table->string('name_en');
                $table->string('name_ar');
                $table->text('description_en')->nullable();
                $table->text('description_ar')->nullable();
                $table->string('image')->nullable();
                $table->boolean('status')->default(true);
                $table->unsignedBigInteger('role_id')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('teacher_services')) {
            Schema::create('teacher_services', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('teacher_id');
                $table->unsignedBigInteger('service_id');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('education_levels')) {
            Schema::create('education_levels', function (Blueprint $table) {
                $table->id();
                $table->string('name_en');
                $table->string('name_ar');
                $table->boolean('status')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('subjects')) {
            Schema::create('subjects', function (Blueprint $table) {
                $table->id();
                $table->string('name_en');
                $table->string('name_ar');
                $table->unsignedBigInteger('education_level_id')->nullable();
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('teacher_subjects')) {
            Schema::create('teacher_subjects', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('teacher_id');
                $table->unsignedBigInteger('subject_id');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('languages')) {
            Schema::create('languages', function (Blueprint $table) {
                $table->id();
                $table->string('name_en');
                $table->string('name_ar');
                $table->boolean('status')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('teacher_languages')) {
            Schema::create('teacher_languages', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('teacher_id');
                $table->unsignedBigInteger('language_id');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('availability_slots')) {
            Schema::create('availability_slots', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('teacher_id');
                $table->unsignedBigInteger('course_id')->nullable();
                $table->unsignedBigInteger('order_id')->nullable();
                $table->date('date')->nullable();
                $table->unsignedTinyInteger('day_number')->nullable();
                $table->time('start_time')->nullable();
                $table->time('end_time')->nullable();
                $table->integer('duration')->nullable();
                $table->boolean('is_available')->default(true);
                $table->boolean('is_booked')->default(false);
                $table->unsignedBigInteger('booking_id')->nullable();
                $table->string('repeat_type')->default('none');
                $table->timestamps();
            });
        }
    }

    public function test_admin_can_update_teacher_profile_fields_and_assignments(): void
    {
        $adminRole = Role::firstOrCreate(['name_key' => 'admin'], ['name_en' => 'Admin', 'name_ar' => 'Admin']);
        $teacherRole = Role::firstOrCreate(['name_key' => 'teacher'], ['name_en' => 'Teacher', 'name_ar' => 'Teacher']);

        $admin = User::create([
            'first_name' => 'Support',
            'last_name' => 'Admin',
            'email' => 'support_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role_id' => $adminRole->id,
            'is_active' => true,
        ]);

        $teacher = User::create([
            'first_name' => 'Old',
            'last_name' => 'Teacher',
            'email' => 'teacher_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role_id' => $teacherRole->id,
            'is_active' => true,
        ]);

        \App\Models\UserProfile::firstOrCreate(['user_id' => $teacher->id]);

        $service = Services::create([
            'key_name' => 'private_lessons',
            'name_en' => 'Private Lessons',
            'name_ar' => 'دروس خاصة',
            'status' => true,
            'role_id' => 3,
        ]);

        $language = Languages::create([
            'name_en' => 'English',
            'name_ar' => 'الإنجليزية',
            'status' => true,
        ]);

        $level = DB::table('education_levels')->insertGetId([
            'name_en' => 'School',
            'name_ar' => 'مدرسة',
            'status' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $subject = Subject::create([
            'name_en' => 'Mathematics',
            'name_ar' => 'الرياضيات',
            'education_level_id' => $level,
            'description' => 'Math',
        ]);

        $response = $this
            ->actingAs($admin, 'sanctum')
            ->putJson('/api/admin/teachers/' . $teacher->id . '/profile', [
                'first_name' => 'Updated',
                'bio' => 'Updated bio',
                'teach_individual' => true,
                'individual_hour_price' => 40.50,
                'teach_group' => false,
                'service_ids' => [$service->id],
                'subject_ids' => [$subject->id],
                'language_ids' => [$language->id],
                'available_times' => [
                    ['day' => 1, 'times' => ['09:00', '10:00']],
                ],
            ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);

        $teacher->refresh();

        $this->assertSame('Updated', $teacher->first_name);
        $this->assertSame('Updated bio', $teacher->profile->bio);
        $this->assertDatabaseHas('teacher_info', [
            'teacher_id' => $teacher->id,
            'teach_individual' => true,
            'individual_hour_price' => '40.50',
        ]);
        $this->assertDatabaseHas('teacher_services', [
            'teacher_id' => $teacher->id,
            'service_id' => $service->id,
        ]);
        $this->assertDatabaseHas('teacher_subjects', [
            'teacher_id' => $teacher->id,
            'subject_id' => $subject->id,
        ]);
        $this->assertDatabaseHas('teacher_languages', [
            'teacher_id' => $teacher->id,
            'language_id' => $language->id,
        ]);
        $this->assertDatabaseHas('availability_slots', [
            'teacher_id' => $teacher->id,
            'day_number' => 1,
        ]);
    }
}
