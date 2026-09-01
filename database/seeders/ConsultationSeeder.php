<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ConsultationSeeder extends Seeder
{
    public function run()
    {
        $categories = [
            [
                'name_en' => 'International Exams',
                'name_ar' => 'الاختبارات الدولية',
                'description_en' => 'Consultations for international exams such as IELTS, TOEFL, SAT, GRE, and more.',
                'description_ar' => 'استشارات للاختبارات الدولية مثل الآيلتس والتوفل والسات والجيمات وغيرها.',
            ],
            [
                'name_en' => 'Research & Papers',
                'name_ar' => 'البحوث والأوراق العلمية',
                'description_en' => 'Help with academic research, theses, and scientific paper writing.',
                'description_ar' => 'مساعدة في البحث الأكاديمي والرسائل العلمية وكتابة الأوراق العلمية.',
            ],
            [
                'name_en' => 'Homework Help',
                'name_ar' => 'مساعدة في الواجبات',
                'description_en' => 'Guided assistance with assignments and homework.',
                'description_ar' => 'مساعدة موجهة في حل الواجبات والتمارين الدراسية.',
            ],
            [
                'name_en' => 'Mathematics',
                'name_ar' => 'الرياضيات',
                'description_en' => 'Consultations in mathematics across all educational levels.',
                'description_ar' => 'استشارات في الرياضيات لجميع المراحل التعليمية.',
            ],
            [
                'name_en' => 'University Admission',
                'name_ar' => 'القبول الجامعي',
                'description_en' => 'Guidance on university admission requirements and applications.',
                'description_ar' => 'إرشادات حول متطلبات القبول الجامعي والتقديم.',
            ],
            [
                'name_en' => 'Career Guidance',
                'name_ar' => 'الإرشاد المهني',
                'description_en' => 'Career path consultations and professional development advice.',
                'description_ar' => 'استشارات في المسارات المهنية وتطوير المهارات.',
            ],
        ];

        foreach ($categories as $index => $category) {
            DB::table('consultation_categories')->updateOrInsert(
                ['name_en' => $category['name_en']],
                array_merge($category, [
                    'icon' => null,
                    'is_active' => true,
                    'sort_order' => $index,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }

        // Create (or update) the consultation service linked to the student role
        DB::table('services')->updateOrInsert(
            ['key_name' => 'consultation'],
            [
                'role_id' => 4,
                'name_en' => 'Consultation',
                'name_ar' => 'الاستشارات',
                'description_en' => 'One-on-one consultations with expert teachers on international exams, research, homework and more.',
                'description_ar' => 'استشارات فردية مع معلمين خبراء في الاختبارات الدولية والبحوث والواجبات والمزيد.',
                'slug' => 'consultation',
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}