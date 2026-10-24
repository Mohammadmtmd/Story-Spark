import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { exportAllDataAsJSON, importDataFromJSON } from '../services/exportService';
import { loadSampleLessonIntoDB, db } from '../db/dexie';

interface BackupExportViewProps {
  onRefreshData: () => Promise<void>;
}

export const BackupExportView: React.FC<BackupExportViewProps> = ({
  onRefreshData,
}) => {
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      await exportAllDataAsJSON();
      setFeedback({ success: true, message: 'فایل پشتیبان JSON با موفقیت در دستگاه شما دانلود شد.' });
    } catch (e: any) {
      setFeedback({ success: false, message: `خطا در صدور پشتیبان: ${e.message}` });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await importDataFromJSON(file);
      await onRefreshData();
      setFeedback({
        success: true,
        message: `پشتیبان با موفقیت بازیابی شد: ${res.lessonsCount} درس و ${res.vocabCount} واژه اضافه شدند.`,
      });
    } catch (err: any) {
      setFeedback({ success: false, message: `خطا در بازگردانی پشتیبان: ${err.message}` });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadDemo = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      await loadSampleLessonIntoDB();
      await onRefreshData();
      setFeedback({
        success: true,
        message: 'درس نمونه «روباه در جنگل جادویی» با موفقیت در کتابخانه و جعبه لایتنر بارگذاری شد!',
      });
    } catch (e: any) {
      setFeedback({ success: false, message: `خطا در بارگذاری نمونه: ${e.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('آیا از پاک کردن کامل تمام درس‌ها و کارت‌های لایتنر از این دستگاه مطمئن هستید؟ این عمل غیرقابل بازگشت است.')) {
      await db.lessons.clear();
      await db.vocabulary.clear();
      await onRefreshData();
      setFeedback({ success: true, message: 'تمام داده‌های حافظه محلی پاکسازی شدند.' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Database className="w-6 h-6 text-amber-500" />
          <span>پشتیبان‌گیری، خروجی و بارگذاری نمونه</span>
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          امکان استخراج تمام درس‌ها و سوابق لایتنر به صورت فایل JSON مستقل، بازگردانی آسان و بارگذاری درس‌های آزمایشی
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
            feedback.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200'
          }`}
        >
          {feedback.success ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Grid of Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Export JSON Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              خروجی کامل داده‌ها (JSON Backup)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
              تمامی درس‌ها، واژگان لایتنر، فواصل زمانی SM-2 و سوالات در یک فایل JSON استاندارد ذخیره می‌شود.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors"
          >
            دانلود فایل پشتیبان JSON
          </button>
        </div>

        {/* Import JSON Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              بازگردانی از فایل پشتیبان
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
              فایل JSON قبلی خود را انتخاب کنید تا درس‌ها و کارت‌های لایتنر فوراً به این مرورگر بازگردانده شوند.
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs transition-colors"
          >
            {isLoading ? 'در حال بازیابی...' : 'انتخاب فایل JSON'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

      </div>

      {/* Demo Lesson & Reset Strip */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>بارگذاری درس نمونه استاندارد</span>
            </h3>
            <p className="text-xs text-stone-500">
              یک درس مصور غنی همراه با تلفظ صوتی، کارت‌های لایتنر و سوالات آزمون برای آزمایش سریع قابلیت‌ها
            </p>
          </div>

          <button
            onClick={handleLoadDemo}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all whitespace-nowrap self-start sm:self-auto"
          >
            بارگذاری درس روباه در جنگل
          </button>
        </div>

        <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-red-600 dark:text-red-400">
              پاکسازی کامل پایگاه داده محلی
            </div>
            <div className="text-[11px] text-stone-400">
              تمامی درس‌ها و واژگان ذخیره‌شده در این مرورگر حذف خواهند شد.
            </div>
          </div>

          <button
            onClick={handleClearAll}
            className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs transition-colors"
          >
            حذف تمام اطلاعات
          </button>
        </div>

      </div>

    </div>
  );
};
