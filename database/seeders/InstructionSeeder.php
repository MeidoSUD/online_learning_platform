<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Instruction;

class InstructionSeeder extends Seeder
{
    public function run()
    {
        $instructions = [
            [
                'title' => 'تعليمات بدء الجلسة',
                'content' => 'يرجى الموافقة على صلاحيات الكاميرا والميكروفون فور طلبها|تأكد من وجود اتصال إنترنت مستقر لتجنب الانقطاع|استخدم سماعات الرأس للحصول على جودة صوت أفضل',
                'type' => 'session_start',
                'target_audience' => 'both',
                'is_active' => true,
            ],
            [
                'title' => 'تعليمات الطالب',
                'content' => 'يمكنك استخدام ميزة رفع اليد لطلب التحدث أو طرح سؤال|استخدم الدردشة الكتابية للتواصل دون مقاطعة الشرح|قم بكتم الميكروفون الخاص بك عند عدم التحدث لتجنب التشويش',
                'type' => 'session_start',
                'target_audience' => 'student',
                'is_active' => true,
            ],
            [
                'title' => 'تعليمات الأستاذ',
                'content' => 'تأكد من إعداد الكاميرا والإضاءة بشكل مناسب قبل البدء|يمكنك مشاركة شاشتك لعرض المواد التعليمية للطلاب|قم بإدارة صلاحيات التحدث ومتابعة الدردشة الكتابية بانتظام',
                'type' => 'session_start',
                'target_audience' => 'teacher',
                'is_active' => true,
            ],
        ];

        foreach ($instructions as $instruction) {
            Instruction::create($instruction);
        }
    }
}
