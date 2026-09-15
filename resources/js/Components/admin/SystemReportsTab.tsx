import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3, BookOpen, Languages, Puzzle, CalendarClock, Users, RefreshCw,
  Loader2, AlertTriangle, GraduationCap, Layers, Sparkles
} from 'lucide-react';
import { adminService } from '../../Services/api';
import { useLanguage } from '../../Contexts/LanguageContext';
import { useToast } from '../../Contexts/ToastContext';

const DAY_NAMES_AR: Record<number, string> = { 1: 'السبت', 2: 'الأحد', 3: 'الإثنين', 4: 'الثلاثاء', 5: 'الأربعاء', 6: 'الخميس', 7: 'الجمعة' };
const DAY_NAMES_EN: Record<number, string> = { 1: 'Saturday', 2: 'Sunday', 3: 'Monday', 4: 'Tuesday', 5: 'Wednesday', 6: 'Thursday', 7: 'Friday' };

type AnyRow = Record<string, any>;

interface SystemReport {
  teachers_total: number;
  coverage: { subjects: number; languages: number; abilities: number; time_slots: number };
  subjects: {
    total: number; offered_distinct: number; teachers_with_subjects: number; missing_count: number;
    missing: AnyRow[]; top: AnyRow[]; by_level: AnyRow[];
  };
  levels: { total: number; rows: AnyRow[] };
  classes: { total: number; rows: AnyRow[] };
  services: { total: number; rows: AnyRow[] };
  languages: { total: number; offered_languages: number; teachers_with_languages: number; rows: AnyRow[]; missing: AnyRow[] };
  abilities: { total: number; offered_abilities: number; teachers_with_abilities: number; rows: AnyRow[]; missing: AnyRow[] };
  time_slots: { total_slots: number; teachers_with_slots: number; teachers_without_slots: number; by_day: AnyRow[]; by_time: AnyRow[] };
}

export const SystemReportsTab: React.FC = () => {
  const { language, direction } = useLanguage();
  const { showToast } = useToast();
  const ar = language === 'ar';
  const [report, setReport] = useState<SystemReport | null>(null);
  const [loading, setLoading] = useState(true);

  const copy = ar ? {
    heading: 'تقرير النظام والإحصاءات', intro: 'نظرة شاملة على الخدمات والمواد واللغات والقدرات والأوقات المتاحة، لمعرفة أماكن الثغرات.', refresh: 'تحديث التقرير', loading: 'جارٍ بناء التقرير...',
    teachersTotal: 'إجمالي المعلمين', withSubjects: 'معلمون لديهم مواد', withLanguages: 'معلمون لديهم لغات', withAbilities: 'معلمون لديهم قدرات', withSlots: 'معلمون لديهم أوقات',
    subjects: 'المواد الدراسية', subjectsGap: 'المواد المضافة', offered: 'المعروضة', missing: 'غير المعروضة', covered: 'جميع المواد مغطاة', missingSubjects: 'مواد لا يدرّسها أي معلم',
    mostSubjects: 'أكثر المواد تدريسًا', subject: 'المادة', teachers: 'عدد المعلمين', level: 'المرحلة', classCols: 'الصف', noData: 'لا توجد بيانات',
    levelsHeading: 'المعلمون حسب المرحلة الدراسية', levelsTotal: 'المراحل', subjectsInLevel: 'المواد في المرحلة', classesHeading: 'المعلمون حسب الصف',
    servicesHeading: 'الخدمات (الأكثر شيوعًا أولًا)', service: 'الخدمة',
    languagesHeading: 'اللغات', languagesTotal: 'اللغات', offeredLangs: 'اللغات المعروضة', missingLangs: 'لغات لا يدرّسها معلم', langWithTeachers: 'معلمون لديهم لغات',
    abilitiesHeading: 'القدرات', abilitiesTotal: 'القدرات', offeredAbilities: 'القدرات المعروضة', missingAbilities: 'قدرات غير مضافة', abilityWithTeachers: 'معلمون لديهم قدرات', ability: 'القدرة',
    slotsHeading: 'الأوقات المتاحة', totalSlots: 'إجمالي الأوقات', withoutSlots: 'معلمون بلا أوقات', slotsPerDay: 'الأوقات حسب اليوم', day: 'اليوم', slots: 'عدد الأوقات', slotsPerTime: 'الأوقات حسب الوقت', time: 'الوقت',
    gap: 'ثغرة', complete: 'مكتمل', loadFailed: 'تعذّر تحميل التقرير',
  } : {
    heading: 'System Report & Statistics', intro: 'A complete view of services, subjects, languages, abilities and available times so the admin can spot the gaps.', refresh: 'Refresh report', loading: 'Building report...',
    teachersTotal: 'Total Teachers', withSubjects: 'Teachers with subjects', withLanguages: 'Teachers with languages', withAbilities: 'Teachers with abilities', withSlots: 'Teachers with time slots',
    subjects: 'Subjects', subjectsGap: 'Subjects added', offered: 'Offered', missing: 'Not offered', covered: 'All subjects are covered', missingSubjects: 'Subjects with no teacher',
    mostSubjects: 'Most taught subjects', subject: 'Subject', teachers: 'Teachers', level: 'Level', classCols: 'Class', noData: 'No data',
    levelsHeading: 'Teachers per education level', levelsTotal: 'Levels', subjectsInLevel: 'Subjects in level', classesHeading: 'Teachers per class',
    servicesHeading: 'Services (most popular first)', service: 'Service',
    languagesHeading: 'Languages', languagesTotal: 'Languages', offeredLangs: 'Languages offered', missingLangs: 'Languages with no teacher', langWithTeachers: 'Teachers with languages',
    abilitiesHeading: 'Abilities', abilitiesTotal: 'Abilities', offeredAbilities: 'Abilities offered', missingAbilities: 'Abilities not added', abilityWithTeachers: 'Teachers with abilities', ability: 'Ability',
    slotsHeading: 'Available time slots', totalSlots: 'Total time slots', withoutSlots: 'Teachers without slots', slotsPerDay: 'Slots per day', day: 'Day', slots: 'Slots', slotsPerTime: 'Slots per time', time: 'Time',
    gap: 'Gap', complete: 'Complete', loadFailed: 'Could not load report',
  };

  const pick = (row: AnyRow) => ar ? (row.name_ar || row.name_en || '—') : (row.name_en || row.name_ar || '—');
  const dayName = (d: number | null) => d === null ? (ar ? 'بدون يوم' : 'No day') : ar ? (DAY_NAMES_AR[d] || `اليوم ${d}`) : (DAY_NAMES_EN[d] || `Day ${d}`);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getSystemReport();
      setReport(data);
    } catch {
      showToast(copy.loadFailed, 'error');
    } finally { setLoading(false); }
  }, [showToast, copy.loadFailed]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const statCard = (label: string, value: React.ReactNode, Icon: React.ElementType, color = 'bg-primary-pale text-primary', sub?: React.ReactNode) => (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-2xl font-bold text-navy leading-tight">{value}</div>
          <div className="mt-0.5 text-xs text-[var(--text-muted)]">{label}</div>
        </div>
        <div className={`h-10 w-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}><Icon size={18} /></div>
      </div>
      {sub && <div className="mt-3 text-xs">{sub}</div>}
    </div>
  );

  const gapBadge = (count: number) => count > 0
    ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700"><AlertTriangle size={13} />{count} {copy.gap}</span>
    : <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{copy.complete}</span>;

  const progress = (value: number, max: number) => max > 0 ? Math.round((value / max) * 100) : 0;

  const bar = (value: number, max: number, warn = false) => {
    const pct = progress(value, max);
    return (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-24 rounded-full bg-[var(--light-bg)]">
          <div className={`h-full rounded-full ${warn ? 'bg-amber-400' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-[var(--text-muted)] w-8">{value}</span>
      </div>
    );
  };

  const table = (headers: string[], rows: React.ReactNode[] | null, emptyMessage: string) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[var(--light-bg)] text-[var(--text-muted)]">
          <tr>{headers.map((h, i) => <th key={i} className="p-3 text-start font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>{rows && rows.length > 0 ? rows : <tr><td colSpan={headers.length} className="p-4 text-center text-[var(--text-muted)]">{emptyMessage}</td></tr>}</tbody>
      </table>
    </div>
  );

  const card = (title: React.ReactNode, body: React.ReactNode, footerRight?: React.ReactNode) => (
    <section className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] p-5">
        <h2 className="flex items-center gap-2 font-bold text-[var(--text-main)]">{title}</h2>
        {footerRight}
      </div>
      <div className="p-5">{body}</div>
    </section>
  );

  if (loading) {
    return <div className="py-16 flex items-center justify-center text-[var(--text-muted)]"><Loader2 className="animate-spin text-primary mr-2" />{copy.loading}</div>;
  }

  if (!report) {
    return <p className="py-16 text-center text-[var(--text-muted)]">{copy.noData}</p>;
  }

  const maxSubject = Math.max(...report.subjects.top.map(r => r.teachers_count), 1);
  const maxService = Math.max(...report.services.rows.map(r => Number(r.teachers_count)), 1);
  const maxLang = Math.max(...report.languages.rows.map(r => Number(r.teachers_count)), 1);
  const maxAbility = Math.max(...report.abilities.rows.map(r => Number(r.teachers_count)), 1);
  const maxLevel = Math.max(...report.levels.rows.map(r => Number(r.teachers_count)), 1);
  const maxTime = Math.max(...report.time_slots.by_time.map(r => Number(r.slots)), 1);

  return (
    <div className="flex-1 min-w-0 animate-fade-in" dir={direction}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--text-main)]"><BarChart3 className="text-primary" />{copy.heading}</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{copy.intro}</p>
          </div>
          <button onClick={loadReport} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-main)] hover:border-primary"><RefreshCw size={16} />{copy.refresh}</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {statCard(copy.teachersTotal, report.teachers_total, Users, 'bg-primary-pale text-primary',
            <span className="text-[var(--text-muted)]">{report.coverage.subjects} {copy.withSubjects.toLowerCase()}</span>)}
          {statCard(copy.withSubjects, report.coverage.subjects, BookOpen, 'bg-blue-50 text-blue-600')}
          {statCard(copy.withLanguages, report.coverage.languages, Languages, 'bg-teal-50 text-teal-600')}
          {statCard(copy.withAbilities, report.coverage.abilities, Sparkles, 'bg-purple-50 text-purple-600')}
          {statCard(copy.withSlots, report.coverage.time_slots, CalendarClock, 'bg-orange-50 text-orange-600')}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {card(
            <><BookOpen size={18} className="text-primary" /> {copy.subjects} {gapBadge(report.subjects.missing_count)}</>,
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-muted)]">{copy.subjectsGap}: <strong className="text-navy">{report.subjects.total}</strong> · {copy.offered}: <strong className="text-navy">{report.subjects.offered_distinct}</strong> · {copy.missing}: <strong className="text-amber-600">{report.subjects.missing_count}</strong></p>
              <div>
                <h3 className="mb-2 text-sm font-bold text-[var(--text-main)]">{copy.mostSubjects}</h3>
                {table([copy.subject, copy.teachers], report.subjects.top.map(s => (
                  <tr key={s.id} className="border-t border-[var(--border)]">
                    <td className="p-3 font-medium">{pick(s)}</td>
                    <td className="p-3">{bar(Number(s.teachers_count), maxSubject)}</td>
                  </tr>
                )), copy.noData)}
              </div>
            </div>
          )}

          {card(
            <><AlertTriangle size={18} className="text-amber-500" /> {copy.missingSubjects}</>,
            report.subjects.missing.length > 0
              ? table([copy.subject, copy.service, copy.level, copy.classCols], report.subjects.missing.map(s => (
                  <tr key={s.id} className="border-t border-[var(--border)] bg-amber-50/40">
                    <td className="p-3 font-medium text-amber-900">{pick(s)}</td>
                    <td className="p-3 text-xs">{ar ? (s.service_ar ?? '—') : (s.service_en ?? '—')}</td>
                    <td className="p-3 text-xs">{ar ? (s.level_ar ?? '—') : (s.level_en ?? '—')}</td>
                    <td className="p-3 text-xs">{ar ? (s.class_ar ?? '—') : (s.class_en ?? '—')}</td>
                  </tr>
                )), copy.noData)
              : <p className="flex items-center gap-2 text-sm text-emerald-700"><span className="rounded-full bg-emerald-100 p-1"><AlertTriangle size={14} /></span>{copy.covered}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {card(
            <><GraduationCap size={18} className="text-primary" /> {copy.levelsHeading} {gapBadge(report.levels.rows.filter(l => Number(l.teachers_count) === 0).length)}</>,
            table([copy.level, copy.subjectsInLevel, copy.teachers], report.levels.rows.map(l => (
              <tr key={l.id} className="border-t border-[var(--border)]">
                <td className="p-3 font-medium">{pick(l)}</td>
                <td className="p-3">{Number(l.total_subjects)}</td>
                <td className="p-3">{bar(Number(l.teachers_count), maxLevel, Number(l.teachers_count) === 0)}</td>
              </tr>
            )), copy.noData)
          )}

          {card(
            <><Layers size={18} className="text-primary" /> {copy.classesHeading} {gapBadge(report.classes.rows.filter(c => Number(c.teachers_count) === 0).length)}</>,
            table([copy.classCols, copy.level, copy.teachers], report.classes.rows.map(c => (
              <tr key={c.id} className="border-t border-[var(--border)]">
                <td className="p-3 font-medium">{pick(c)}</td>
                <td className="p-3 text-xs">{ar ? (c.level_ar ?? '—') : (c.level_en ?? '—')}</td>
                <td className="p-3">{bar(Number(c.teachers_count), maxLevel, Number(c.teachers_count) === 0)}</td>
              </tr>
            )), copy.noData)
          )}
        </div>

        {card(
          <><Sparkles size={18} className="text-primary" /> {copy.servicesHeading} {gapBadge(report.services.rows.filter(s => Number(s.teachers_count) === 0).length)}</>,
          table([copy.service, copy.teachers], report.services.rows.map(s => (
            <tr key={s.id} className="border-t border-[var(--border)]">
              <td className="p-3 font-medium">{pick(s)}</td>
              <td className="p-3">{bar(Number(s.teachers_count), maxService, Number(s.teachers_count) === 0)}</td>
            </tr>
          )), copy.noData)
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {card(
            <><Languages size={18} className="text-teal-600" /> {copy.languagesHeading}
              <span className="text-sm font-medium text-[var(--text-muted)]">{copy.languagesTotal}: {report.languages.total} · {copy.offeredLangs}: {report.languages.offered_languages}</span></>,
            <div className="space-y-3">
              {table([copy.ability, copy.teachers], report.languages.rows.map(l => (
                <tr key={l.id} className="border-t border-[var(--border)]">
                  <td className={`p-3 font-medium ${Number(l.teachers_count) === 0 ? 'text-amber-700' : ''}`}>{pick(l)}</td>
                  <td className="p-3">{bar(Number(l.teachers_count), maxLang, Number(l.teachers_count) === 0)}</td>
                </tr>
              )), copy.noData)}
              {report.languages.missing.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="mb-2 flex items-center gap-1 text-xs font-bold text-amber-700"><AlertTriangle size={13} />{copy.missingLangs}</p>
                  <div className="flex flex-wrap gap-1.5">{report.languages.missing.map(l => (
                    <span key={l.id} className="rounded-full bg-white px-2.5 py-1 text-xs text-amber-800 border border-amber-200">{pick(l)}</span>
                  ))}</div>
                </div>
              )}
            </div>
          )}

          {card(
            <><Puzzle size={18} className="text-purple-600" /> {copy.abilitiesHeading}
              <span className="text-sm font-medium text-[var(--text-muted)]">{copy.abilitiesTotal}: {report.abilities.total} · {copy.offeredAbilities}: {report.abilities.offered_abilities}</span></>,
            <div className="space-y-3">
              {table([copy.ability, copy.teachers], report.abilities.rows.map(a => (
                <tr key={a.id} className="border-t border-[var(--border)]">
                  <td className={`p-3 font-medium ${Number(a.teachers_count) === 0 ? 'text-amber-700' : ''}`}>{pick(a)}</td>
                  <td className="p-3">{bar(Number(a.teachers_count), maxAbility, Number(a.teachers_count) === 0)}</td>
                </tr>
              )), copy.noData)}
              {report.abilities.missing.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="mb-2 flex items-center gap-1 text-xs font-bold text-amber-700"><AlertTriangle size={13} />{copy.missingAbilities}</p>
                  <div className="flex flex-wrap gap-1.5">{report.abilities.missing.map(a => (
                    <span key={a.id} className="rounded-full bg-white px-2.5 py-1 text-xs text-amber-800 border border-amber-200">{pick(a)}</span>
                  ))}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {card(
          <><CalendarClock size={18} className="text-orange-600" /> {copy.slotsHeading} {gapBadge(report.time_slots.teachers_without_slots)}</>,
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {statCard(copy.totalSlots, report.time_slots.total_slots, CalendarClock, 'bg-orange-50 text-orange-600')}
              {statCard(copy.withSlots, report.time_slots.teachers_with_slots, Users, 'bg-emerald-50 text-emerald-600')}
              {statCard(copy.withoutSlots, report.time_slots.teachers_without_slots, AlertTriangle, 'bg-amber-50 text-amber-600')}
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <h3 className="mb-2 text-sm font-bold text-[var(--text-main)]">{copy.slotsPerDay}</h3>
                <table className="w-full text-sm">
                  <thead className="bg-[var(--light-bg)] text-[var(--text-muted)]">
                    <tr><th className="p-3 text-start font-medium">{copy.day}</th><th className="p-3 text-start font-medium">{copy.slots}</th><th className="p-3 text-start font-medium">{copy.teachers}</th></tr>
                  </thead>
                  <tbody>{report.time_slots.by_day.map(d => (
                    <tr key={d.day_number ?? 'null'} className="border-t border-[var(--border)]">
                      <td className="p-3 font-medium">{dayName(d.day_number)}</td>
                      <td className="p-3">{bar(Number(d.slots), Math.max(...report.time_slots.by_day.map(x => Number(x.slots)), 1))}</td>
                      <td className="p-3 text-[var(--text-muted)]">{d.teachers_count}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-bold text-[var(--text-main)]">{copy.slotsPerTime}</h3>
                <table className="w-full text-sm">
                  <thead className="bg-[var(--light-bg)] text-[var(--text-muted)]">
                    <tr><th className="p-3 text-start font-medium">{copy.time}</th><th className="p-3 text-start font-medium">{copy.slots}</th></tr>
                  </thead>
                  <tbody>{report.time_slots.by_time.map(t => (
                    <tr key={t.start_time} className="border-t border-[var(--border)]">
                      <td className="p-3 font-medium">{t.start_time}</td>
                      <td className="p-3">{bar(Number(t.slots), maxTime)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};