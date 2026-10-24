import React, { useState } from 'react';
import {
  Search,
  Filter,
  FileDown,
  Trash2,
  BookOpen,
  Award,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import type { Lesson, AgeGroup, CEFRLevel } from '../types';
import { exportLessonToWordDoc } from '../services/exportService';

interface ArchiveViewProps {
  lessons: Lesson[];
  onSelectLesson: (lesson: Lesson) => void;
  onStartQuiz: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => Promise<void>;
  onCreateNew: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  lessons,
  onSelectLesson,
  onStartQuiz,
  onDeleteLesson,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [selectedCEFR, setSelectedCEFR] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter lessons
  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.titleFa.includes(searchQuery) ||
      lesson.vocabulary.some((v) => v.word.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAge = selectedAge === 'all' || lesson.ageLevel === selectedAge;
    const matchesCEFR = selectedCEFR === 'all' || lesson.cefrLevel === selectedCEFR;

    return matchesSearch && matchesAge && matchesCEFR;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('آیا از حذف این درس و واژگان آن از حافظه مطمئن هستید؟')) {
      setDeletingId(id);
      await onDeleteLesson(id);
      setDeletingId(null);
    }
  };

  const handleDownloadWord = async (lesson: Lesson, e: React.MouseEvent) => {
    e.stopPropagation();
    await exportLessonToWordDoc(lesson);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header & Controls Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            آرشیو درس‌های تولیدشده
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            مدیریت، جستجو، دانلود برگه تمرین و مرور درس‌های ثبت‌شده در حافظه دستگاه
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all self-start md:self-auto"
        >
          + تحلیل صفحه جدید
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col md:flex-row gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان انگلیسی، فارسی یا کلمات هدف..."
            className="w-full pr-10 pl-4 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border-none focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100 placeholder-stone-400"
          />
        </div>

        {/* Filter by Age */}
        <div className="flex items-center gap-2">
          <select
            value={selectedAge}
            onChange={(e) => setSelectedAge(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border-none focus:ring-1 focus:ring-amber-500 text-stone-700 dark:text-stone-300"
          >
            <option value="all">همه رده‌های سنی</option>
            <option value="3-5">۳ تا ۵ سال</option>
            <option value="6-8">۶ تا ۸ سال</option>
            <option value="9-12">۹ تا ۱۲ سال</option>
          </select>

          {/* Filter by CEFR */}
          <select
            value={selectedCEFR}
            onChange={(e) => setSelectedCEFR(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border-none focus:ring-1 focus:ring-amber-500 text-stone-700 dark:text-stone-300 font-en"
          >
            <option value="all">All CEFR Levels</option>
            <option value="Pre-A1">Pre-A1 Starters</option>
            <option value="A1">A1 Movers</option>
            <option value="A2">A2 Flyers</option>
            <option value="B1">B1 Intermediate</option>
          </select>
        </div>

      </div>

      {/* Lesson Grid */}
      {filteredLessons.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-800 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-stone-400" />
          <div className="text-sm font-bold text-stone-700 dark:text-stone-300">
            هیچ درسی با این مشخصات یافت نشد
          </div>
          <p className="text-xs text-stone-400">
            کلمات جستجو را تغییر دهید یا یک درس جدید بسازید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              onClick={() => onSelectLesson(lesson)}
              className="group cursor-pointer rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500/40 shadow-xs hover:shadow-lg transition-all flex flex-col overflow-hidden"
            >
              {/* Thumbnail Container */}
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

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base font-en line-clamp-1 group-hover:text-amber-600 transition-colors">
                    {lesson.titleEn}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1">
                    {lesson.titleFa}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{lesson.vocabulary.length} واژه</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(lesson.createdAt).toLocaleDateString('fa-IR')}</span>
                  </span>
                </div>

                {/* Card Actions Bottom */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleDownloadWord(lesson, e)}
                      title="دانلود برگه ورد Word (.docx)"
                      className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      <FileDown className="w-4 h-4 text-amber-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartQuiz(lesson);
                      }}
                      title="شروع آزمون"
                      className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      <Award className="w-4 h-4 text-emerald-600" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(lesson.id, e)}
                      disabled={deletingId === lesson.id}
                      title="حذف درس"
                      className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <span>مشاهده</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
