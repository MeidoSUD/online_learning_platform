<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SystemReportController extends Controller
{
    /**
     * Comprehensive coverage report for the admin dashboard.
     *
     * Reveals what teachers DO offer (subjects / languages / abilities /
     * time slots) and where the gaps are, so the admin can see at a glance
     * which services, levels, languages, subjects or slots are missing.
     */
    public function stats(): JsonResponse
    {
        try {
            $teachersTotal = User::where('role_id', 3)->count();

            return response()->json([
                'success' => true,
                'generated_at' => now()->toDateTimeString(),
                'data' => [
                    'teachers_total' => $teachersTotal,
                    'coverage' => [
                        'subjects' => $this->distinctCount('teacher_subjects', 'teacher_id'),
                        'languages' => $this->distinctCount('teacher_languages', 'teacher_id'),
                        'abilities' => $this->distinctCount('teacher_abilities', 'teacher_id'),
                        'time_slots' => $this->distinctCount('availability_slots', 'teacher_id'),
                    ],
                    'subjects' => $this->subjectsReport(),
                    'levels' => $this->levelsReport(),
                    'classes' => $this->classesReport(),
                    'services' => $this->servicesReport(),
                    'languages' => $this->languagesReport(),
                    'abilities' => $this->abilitiesReport(),
                    'time_slots' => $this->timeSlotsReport(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('System report failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return response()->json(['success' => false, 'message' => 'Failed to build system report'], 500);
        }
    }

    private function distinctCount(string $table, string $column): int
    {
        return (int) DB::table($table)->distinct()->count($column);
    }

    private function subjectsReport(): array
    {
        $offeredIds = DB::table('teacher_subjects')->distinct()->pluck('subject_id');

        $missing = DB::table('subjects as s')
            ->leftJoin('services as sv', 'sv.id', '=', 's.service_id')
            ->leftJoin('education_levels as el', 'el.id', '=', 's.education_level_id')
            ->leftJoin('classes as c', 'c.id', '=', 's.class_id')
            ->whereNotIn('s.id', $offeredIds)
            ->select(
                's.id',
                's.name_en',
                's.name_ar',
                's.service_id',
                'sv.name_en as service_en',
                'sv.name_ar as service_ar',
                's.education_level_id',
                'el.name_en as level_en',
                'el.name_ar as level_ar',
                'c.name_en as class_en',
                'c.name_ar as class_ar',
            )
            ->orderBy('s.service_id')
            ->orderBy('s.education_level_id')
            ->orderBy('s.name_en')
            ->get();

        $top = DB::table('teacher_subjects as ts')
            ->join('subjects as s', 's.id', '=', 'ts.subject_id')
            ->select('s.id', 's.name_en', 's.name_ar', DB::raw('count(distinct ts.teacher_id) as teachers_count'))
            ->groupBy('s.id', 's.name_en', 's.name_ar')
            ->orderByDesc('teachers_count')
            ->limit(10)
            ->get();

        $byLevel = DB::table('subjects as s')
            ->leftJoin('teacher_subjects as ts', 'ts.subject_id', '=', 's.id')
            ->leftJoin('education_levels as el', 'el.id', '=', 's.education_level_id')
            ->select(
                's.education_level_id',
                'el.name_en as level_en',
                'el.name_ar as level_ar',
                DB::raw('count(distinct s.id) as total_subjects'),
                DB::raw('count(distinct ts.teacher_id) as teachers_count'),
            )
            ->groupBy('s.education_level_id', 'el.name_en', 'el.name_ar')
            ->orderBy('s.education_level_id')
            ->get();

        return [
            'total' => (int) DB::table('subjects')->count(),
            'offered_distinct' => $offeredIds->count(),
            'teachers_with_subjects' => $this->distinctCount('teacher_subjects', 'teacher_id'),
            'missing_count' => $missing->count(),
            'missing' => $missing,
            'top' => $top,
            'by_level' => $byLevel,
        ];
    }

    private function levelsReport(): array
    {
        $rows = DB::table('education_levels as el')
            ->leftJoin('subjects as s', 's.education_level_id', '=', 'el.id')
            ->leftJoin('teacher_subjects as ts', 'ts.subject_id', '=', 's.id')
            ->select(
                'el.id',
                'el.name_en',
                'el.name_ar',
                DB::raw('count(distinct s.id) as total_subjects'),
                DB::raw('count(distinct ts.teacher_id) as teachers_count'),
            )
            ->groupBy('el.id', 'el.name_en', 'el.name_ar')
            ->orderBy('el.id')
            ->get();

        return [
            'total' => (int) DB::table('education_levels')->count(),
            'rows' => $rows,
        ];
    }

    private function classesReport(): array
    {
        $rows = DB::table('classes as c')
            ->leftJoin('subjects as s', 's.class_id', '=', 'c.id')
            ->leftJoin('teacher_subjects as ts', 'ts.subject_id', '=', 's.id')
            ->leftJoin('education_levels as el', 'el.id', '=', 'c.education_level_id')
            ->select(
                'c.id',
                'c.name_en',
                'c.name_ar',
                'c.education_level_id',
                'el.name_en as level_en',
                'el.name_ar as level_ar',
                DB::raw('count(distinct s.id) as total_subjects'),
                DB::raw('count(distinct ts.teacher_id) as teachers_count'),
            )
            ->groupBy('c.id', 'c.name_en', 'c.name_ar', 'c.education_level_id', 'el.name_en', 'el.name_ar')
            ->orderBy('c.education_level_id')
            ->orderBy('c.id')
            ->get();

        return [
            'total' => (int) DB::table('classes')->count(),
            'rows' => $rows,
        ];
    }

    private function servicesReport(): array
    {
        $rows = DB::table('services as sv')
            ->leftJoin('teacher_services as tsv', 'tsv.service_id', '=', 'sv.id')
            ->select(
                'sv.id',
                'sv.key_name',
                'sv.name_en',
                'sv.name_ar',
                DB::raw('coalesce(count(distinct tsv.teacher_id), 0) as teachers_count'),
            )
            ->groupBy('sv.id', 'sv.key_name', 'sv.name_en', 'sv.name_ar')
            ->orderByDesc('teachers_count')
            ->get();

        return [
            'total' => (int) DB::table('services')->count(),
            'rows' => $rows,
        ];
    }

    private function languagesReport(): array
    {
        $rows = DB::table('languages as l')
            ->leftJoin('teacher_languages as tl', 'tl.language_id', '=', 'l.id')
            ->select(
                'l.id',
                'l.name_en',
                'l.name_ar',
                DB::raw('coalesce(count(distinct tl.teacher_id), 0) as teachers_count'),
            )
            ->groupBy('l.id', 'l.name_en', 'l.name_ar')
            ->orderByDesc('teachers_count')
            ->orderBy('l.name_en')
            ->get();

        return [
            'total' => (int) DB::table('languages')->count(),
            'offered_languages' => $this->distinctCount('teacher_languages', 'language_id'),
            'teachers_with_languages' => $this->distinctCount('teacher_languages', 'teacher_id'),
            'rows' => $rows,
            'missing' => $rows->where('teachers_count', 0)->values(),
        ];
    }

    private function abilitiesReport(): array
    {
        $rows = DB::table('abilities as a')
            ->leftJoin('teacher_abilities as ta', 'ta.ability_id', '=', 'a.id')
            ->select(
                'a.id',
                'a.name_en',
                'a.name_ar',
                DB::raw('coalesce(count(distinct ta.teacher_id), 0) as teachers_count'),
            )
            ->groupBy('a.id', 'a.name_en', 'a.name_ar')
            ->orderByDesc('teachers_count')
            ->orderBy('a.name_en')
            ->get();

        return [
            'total' => (int) DB::table('abilities')->count(),
            'offered_abilities' => $this->distinctCount('teacher_abilities', 'ability_id'),
            'teachers_with_abilities' => $this->distinctCount('teacher_abilities', 'teacher_id'),
            'rows' => $rows,
            'missing' => $rows->where('teachers_count', 0)->values(),
        ];
    }

    private function timeSlotsReport(): array
    {
        $teachersTotal = User::where('role_id', 3)->count();
        $teachersWithSlots = $this->distinctCount('availability_slots', 'teacher_id');

        $byDay = DB::table('availability_slots')
            ->select('day_number', DB::raw('count(*) as slots'), DB::raw('count(distinct teacher_id) as teachers_count'))
            ->groupBy('day_number')
            ->orderByRaw('day_number IS NULL, day_number')
            ->get();

        $byTime = DB::table('availability_slots')
            ->select('start_time', DB::raw('count(*) as slots'))
            ->groupBy('start_time')
            ->orderBy('start_time')
            ->get();

        return [
            'total_slots' => (int) DB::table('availability_slots')->count(),
            'teachers_with_slots' => $teachersWithSlots,
            'teachers_without_slots' => max(0, $teachersTotal - $teachersWithSlots),
            'by_day' => $byDay,
            'by_time' => $byTime,
        ];
    }
}