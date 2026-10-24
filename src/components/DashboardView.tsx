import React from 'react';
import {
  Sparkles,
  BookOpen,
  Layers,
  Award,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
} from 'lucide-react';
import type { Lesson, VocabularyItem } from '../types';
import type { ActiveTab } from './Navbar';

interface DashboardViewProps {
  lessons: Lesson[];
  vocabulary: VocabularyItem[];
  onSelectLesson: (lesson: Lesson) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onLoadSample: () => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  lessons,
  vocabulary,
  onSelectLesson,
  setActiveTab,
  onLoadSample,
}) => {
  // Compute stats
  const totalLessons = lessons.length;
  const totalWords = vocabulary.length;

  const now = new Date();
  const dueWords = vocabulary.filter(
    (v) => !v.nextReviewDate || new Date(v.nextReviewDate) <= now
  ).length;

  const masteredWords = vocabulary.filter((v) => v.masteryLevel === 'mastered').length;
  const learningWords = vocabulary.filter(
    (v) => v.masteryLevel === 'learning' || v.masteryLevel === 'review'
  ).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 p-8 text-white shadow-xl shadow-amber-500/10">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-amber-100">
            <Sparkles className="w-4 h-4" />
            <span>استودیوی تحلیل هوشمند کتاب داستان کودکان</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug">
            کتاب‌های فیزیکی را به دنیای شگفت‌انگیز یادگیری تعاملی تبدیل کنید!
          </h1>
          <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed">
            از صفحه کتاب داستان کودک خود عکس بگیرید؛ هوش مصنوعی بینایی آن را به داستانی اختصاصی، واژگان کلیدی با راهنمای آواشناسی فارسی، آزمون‌های شاداب و فلش‌کارت‌های هوشمند لایتنر تبدیل می‌کند.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-stone-900 font-bold text-sm shadow-md hover:bg-amber-50 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>تحلیل صفحه جدید با دوربین</span>
            </button>
            {totalLessons === 0 && (
              <button
                onClick={onLoadSample}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium text-sm transition-all"
              >
                <Compass className="w-4 h-4" />
                <span>بارگذاری درس نمونه برای آزمایش</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Pedagogical Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">درس‌های ساخته شده</div>
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1 tabular-nums">
              {totalLessons}
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">صفحات تحلیل شده</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">کل واژگان هدف</div>
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1 tabular-nums">
              {totalWords}
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">همراه با تلفظ و مثال</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">نیاز به مرور امروز</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1 tabular-nums">
              {dueWords}
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">جعبه لایتنر هوشمند</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">کلمات به تسلط رسیده</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {masteredWords}
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">{learningWords} کلمه در چرخه یادگیری</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div
          onClick={() => setActiveTab('create')}
          className="group cursor-pointer p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500/50 shadow-xs hover:shadow-lg transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
            تحلیل هوشمند تصویر کتاب
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-4">
            تصویر هر کتابی را اسکن یا بارگذاری کنید؛ هوش مصنوعی آن را فورا به یک درس کامل با آزمون و فلش‌کارت تبدیل می‌کند.
          </p>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 group-hover:gap-2.5 transition-all">
            <span>شروع اسکن صفحه</span>
            <ArrowLeft className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('leitner')}
          className="group cursor-pointer p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 shadow-xs hover:shadow-lg transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
            جعبه لایتنر و فلش‌کارت سه‌بعدی
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-4">
            الگوریتم تکرار با فاصله (SM-2) همراه با تلفظ صوتی نیتیو انگلیسی، راهنمای خواندن فارسی و کارت‌های چرخشی.
          </p>
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 group-hover:gap-2.5 transition-all">
            <span>مرور واژگان امروز ({dueWords})</span>
            <ArrowLeft className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('quiz')}
          className="group cursor-pointer p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-lg transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
            آزمون تعاملی و درک مطلب
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-4">
            سوالات چهارگزینه‌ای، جای خالی، تطبیق صدای آواشناسی و حروف به‌هم‌ریخته همراه با انیمیشن جشن و کارنامه نهایی.
          </p>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 group-hover:gap-2.5 transition-all">
            <span>ورود به میدان آزمون</span>
            <ArrowLeft className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* Recent Lessons Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              آخرین درس‌های آموزشی
            </h2>
          </div>
          {lessons.length > 0 && (
            <button
              onClick={() => setActiveTab('archive')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"
            >
              <span>مشاهده همه در آرشیو</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {lessons.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-800 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 mx-auto flex items-center justify-center text-amber-600 dark:text-amber-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
                هنوز درسی ذخیره نشده است
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                کتاب داستان مورد علاقه فرزندتان را باز کنید، از صفحه‌ای عکس بگیرید و دکمه زیر را لمس نمایید تا یادگیری آغاز شود.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('create')}
                className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all"
              >
                ساخت اولین درس با عکس
              </button>
              <button
                onClick={onLoadSample}
                className="px-4 py-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium text-xs transition-all"
              >
                بارگذاری درس نمونه روباه و جنگل
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {lessons.slice(0, 3).map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => onSelectLesson(lesson)}
                className="group cursor-pointer overflow-hidden rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500/40 shadow-xs hover:shadow-md transition-all"
              >
                <div className="relative aspect-video bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <img
                    src={lesson.imageThumbnail}
                    alt={lesson.titleEn}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-stone-900/80 backdrop-blur-sm text-[11px] font-bold text-white">
                    {lesson.ageLevel} سال
                  </div>
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-amber-500/90 backdrop-blur-sm text-[11px] font-bold text-white font-en">
                    {lesson.cefrLevel}
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base font-en line-clamp-1">
                    {lesson.titleEn}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1">
                    {lesson.titleFa}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs text-stone-400 dark:text-stone-500 border-t border-stone-100 dark:border-stone-800">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{lesson.vocabulary.length} واژه</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(lesson.createdAt).toLocaleDateString('fa-IR')}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
