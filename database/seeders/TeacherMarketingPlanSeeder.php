<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TeacherMarketingPlan;

class TeacherMarketingPlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        TeacherMarketingPlan::updateOrCreate(
            ['duration_months' => 1],
            [
                'name_ar' => 'باقة الترويج الشهري (شهر واحد)',
                'name_en' => '1 Month Teacher Boost Plan',
                'description_ar' => 'إظهار حسابك كمعلم مميز في بنرات الصفحة الرئيسية وتطبيق الجوال لمدة 30 يوماً لزيادة عدد الحجوزات والطلاب.',
                'description_en' => 'Promote your profile as a featured teacher on the home screen banner for 30 days to maximize bookings.',
                'duration_months' => 1,
                'duration_days' => 30,
                'price' => 99.00,
                'badge_text_ar' => 'معلم مميز',
                'badge_text_en' => 'Featured Teacher',
                'is_active' => true,
                'display_order' => 1,
            ]
        );

        TeacherMarketingPlan::updateOrCreate(
            ['duration_months' => 3],
            [
                'name_ar' => 'باقة الترويج الفصلي (3 أشهر)',
                'name_en' => '3 Months Teacher Boost Plan',
                'description_ar' => 'إظهار حسابك كمعلم مميز في بنرات الصفحة الرئيسية وتطبيق الجوال لمدة 90 يوماً مع توفير أكبر وظهور مستمر.',
                'description_en' => 'Promote your profile as a featured teacher on the home screen banner for 90 days with continuous top visibility.',
                'duration_months' => 3,
                'duration_days' => 90,
                'price' => 249.00,
                'badge_text_ar' => 'معلم مميز',
                'badge_text_en' => 'Featured Teacher',
                'is_active' => true,
                'display_order' => 2,
            ]
        );
    }
}

