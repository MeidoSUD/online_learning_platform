<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\GeneralService;

class GeneralServicesSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            [
                'name_ar' => 'الأبحاث والمشاريع الأكاديمية',
                'name_en' => 'Academic Research & Projects',
                'description_ar' => 'إعداد ومراجعة الأبحاث والمشاريع الأكاديمية وفق المعايير الجامعية.',
                'description_en' => 'Preparation and review of academic research and projects per university standards.',
                'icon' => null,
                'status' => true,
            ],
            [
                'name_ar' => 'التدقيق اللغوي والتحرير',
                'name_en' => 'Proofreading & Editing',
                'description_ar' => 'تدقيق لغوي وتحرير للنصوص والرسائل العلمية.',
                'description_en' => 'Linguistic proofreading and editing for texts and theses.',
                'icon' => null,
                'status' => true,
            ],
            [
                'name_ar' => 'الترجمة المعتمدة',
                'name_en' => 'Certified Translation',
                'description_ar' => 'ترجمة معتمدة للوثائق والمستندات الأكاديمية.',
                'description_en' => 'Certified translation of academic documents.',
                'icon' => null,
                'status' => true,
            ],
            [
                'name_ar' => 'الاستشارات والتحليل الإحصائي',
                'name_en' => 'Consulting & Statistical Analysis',
                'description_ar' => 'استشارات أكاديمية وتحليل إحصائي باستخدام SPSS وغيره.',
                'description_en' => 'Academic consulting and statistical analysis using SPSS and more.',
                'icon' => null,
                'status' => true,
            ],
            [
                'name_ar' => 'تصميم العروض والحقائب التدريبية',
                'name_en' => 'Presentations & Training Kits',
                'description_ar' => 'تصميم عروض تقديمية وحقائب تدريبية احترافية.',
                'description_en' => 'Design of professional presentations and training kits.',
                'icon' => null,
                'status' => true,
            ],
            [
                'name_ar' => 'مراجعة رسائل الماجستير والدكتوراه',
                'name_en' => 'Masters & PhD Thesis Review',
                'description_ar' => 'مراجعة علمية ومنهجية لرسائل الماجستير والدكتوراه.',
                'description_en' => 'Scientific and methodological review of Masters and PhD theses.',
                'icon' => null,
                'status' => true,
            ],
        ];

        foreach ($services as $service) {
            GeneralService::updateOrCreate(
                ['name_en' => $service['name_en']],
                $service
            );
        }
    }
}
