import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Sliders,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  Volume2,
  Settings,
} from 'lucide-react';
import type {
  AgeGroup,
  CEFRLevel,
  EnglishAccent,
  StoryStyle,
  StoryLength,
  AISettings,
  Lesson,
} from '../types';
import { analyzeBookPage } from '../services/aiService';
import { db } from '../db/dexie';

interface CreateLessonViewProps {
  settings: AISettings;
  onLessonCreated: (lesson: Lesson) => void;
  onOpenSettings: () => void;
}

export const CreateLessonView: React.FC<CreateLessonViewProps> = ({
  settings,
  onLessonCreated,
  onOpenSettings,
}) => {
  // Input states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [originalFileSize, setOriginalFileSize] = useState<string>('');
  const [compressedFileSize, setCompressedFileSize] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  // Pedagogical parameters
  const [ageLevel, setAgeLevel] = useState<AgeGroup>('6-8');
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('A1');
  const [accent, setAccent] = useState<EnglishAccent>('en-US');
  const [style, setStyle] = useState<StoryStyle>('playful');
  const [length, setLength] = useState<StoryLength>('medium');
  const [vocabCount, setVocabCount] = useState<number>(8);
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Loading & Progress
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Pedagogical steps for animated loading
  const pedagogicalSteps = [
    'بررسی وضوح تصویر و خوانش متن چاپی کتاب...',
    'شناسایی بصری کاراکترها، حیوانات، رنگ‌ها و موقعیت فضایی...',
    'نگارش خلاقانه داستان کودکانه متناسب با سطح انتخابی...',
    'استخراج واژگان کلیدی با خط فونتیک IPA و راهنمای خواندن فارسی...',
    'طراحی تمرین‌ها، فوکوس آواشناسی و ممیزی پداگوژیک نهایی...',
  ];

  /**
   * Client-side HTML5 canvas image compressor:
   * Constrains max dimension to 1600px and saves at 0.88 JPEG quality.
   */
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('لطفاً یک فایل تصویری معتبر (JPG, PNG, WEBP) انتخاب کنید.');
      return;
    }

    setErrorMessage(null);
    setIsCompressing(true);
    setOriginalFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setSelectedImage(compressedDataUrl);

          // Calculate compressed size in KB
          const stringLength = compressedDataUrl.length - 'data:image/jpeg;base64,'.length;
          const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.562489633438312;
          const sizeInKb = (sizeInBytes / 1024).toFixed(0);
          setCompressedFileSize(`${sizeInKb} KB`);
        }
        setIsCompressing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  /**
   * Trigger AI Multimodal Pipeline
   */
  const handleStartAnalysis = async () => {
    if (!selectedImage) {
      setErrorMessage('لطفاً ابتدا تصویری از صفحه کتاب داستان بارگذاری کنید.');
      return;
    }

    // Check if key is required
    if (settings.directBrowserMode && !settings.apiKey) {
      setErrorMessage('کلید API وارد نشده است. لطفاً برای استفاده از هوش مصنوعی، کلید خود را در تنظیمات وارد نمایید.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setActiveStep(0);

    // Simulate step progress increments for smooth UX
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < pedagogicalSteps.length - 1 ? prev + 1 : prev));
    }, 2800);

    try {
      const generatedLesson = await analyzeBookPage(
        {
          imageBase64: selectedImage,
          ageLevel,
          cefrLevel,
          accent,
          style,
          length,
          vocabCount,
          questionCount,
        },
        settings
      );

      clearInterval(interval);
      setActiveStep(pedagogicalSteps.length - 1);

      // Save to IndexedDB
      await db.lessons.put(generatedLesson);
      for (const vocab of generatedLesson.vocabulary) {
        await db.vocabulary.put(vocab);
      }

      setTimeout(() => {
        setIsAnalyzing(false);
        onLessonCreated(generatedLesson);
      }, 800);
    } catch (err: any) {
      clearInterval(interval);
      setIsAnalyzing(false);
      setErrorMessage(err.message || 'خطا در تحلیل تصویر صفحه کتاب داستان.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Title Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>استودیو هوشمند پردازش تصویر و تبدیل به درس</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
          عکس صفحه کتاب را بارگذاری کنید
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          هوش مصنوعی چندوجهی عناصر تصویر، شخصیت‌ها و اشیا را استخراج کرده و یک درس غنی همراه با تلفظ، واژگان و آزمون برای کودک شما خلق می‌کند.
        </p>
      </div>

      {/* Direct API Key check alert */}
      {settings.directBrowserMode && !settings.apiKey && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-xs text-amber-800 dark:text-amber-200">
              برای ارتباط مستقیم و پرسرعت مرورگر با هوش مصنوعی، لطفاً کلید API رایگان گوگل جمینای یا سایر سرویس‌ها را وارد کنید.
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap shadow-xs"
          >
            ورود به تنظیمات
          </button>
        </div>
      )}

      {/* Main Grid: Upload Area & Pedagogical Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Image Upload & Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`relative min-h-[340px] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center ${
              selectedImage
                ? 'border-amber-400 bg-amber-50/20 dark:bg-stone-900'
                : 'border-stone-300 dark:border-stone-800 hover:border-amber-400 bg-white dark:bg-stone-900/60'
            }`}
          >
            {selectedImage ? (
              <div className="space-y-4 w-full">
                <div className="relative max-h-[300px] overflow-hidden rounded-2xl mx-auto shadow-md">
                  <img
                    src={selectedImage}
                    alt="Uploaded book page"
                    className="w-full h-auto max-h-[300px] object-contain mx-auto bg-stone-950"
                  />
                  <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-stone-900/80 backdrop-blur-sm text-[11px] text-white font-medium">
                    {compressedFileSize} (بهینه‌شده از {originalFileSize})
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors"
                  >
                    تغییر عکس
                  </button>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors"
                  >
                    حذف تصویر
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-sm">
                <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 mx-auto flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
                    عکس صفحه کتاب را بکشید و رها کنید
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    یا با استفاده از دکمه‌های زیر عکس را از گالری انتخاب کرده یا مستقیماً عکاسی کنید
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>انتخاب از فایل‌ها</span>
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs transition-colors"
                  >
                    <Camera className="w-4 h-4 text-amber-600" />
                    <span>عکس گرفتن با دوربین</span>
                  </button>
                </div>

                <div className="text-[11px] text-stone-400 pt-2">
                  فرمت‌های مجاز: JPG, PNG, WEBP · فشرده‌سازی خودکار هوشمند تا ۱۶۰۰ پیکسل
                </div>
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
            />
          </div>

          {/* Error feedback */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Right Column: Pedagogical Settings Drawer (5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                تنظیمات پداگوژیک درس
              </h3>
            </div>
            <span className="text-[11px] text-stone-400">سفارشی‌سازی برای کودک</span>
          </div>

          {/* Age Group */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              گروه سنی زبان‌آموز
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['3-5', '6-8', '9-12'] as AgeGroup[]).map((ag) => (
                <button
                  key={ag}
                  type="button"
                  onClick={() => setAgeLevel(ag)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                    ageLevel === ag
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                  }`}
                >
                  {ag} سال
                </button>
              ))}
            </div>
          </div>

          {/* CEFR Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              سطح استاندارد زبان (CEFR)
            </label>
            <div className="grid grid-cols-4 gap-2 font-en">
              {(['Pre-A1', 'A1', 'A2', 'B1'] as CEFRLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setCefrLevel(lvl)}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    cefrLevel === lvl
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-amber-600" />
              <span>لهجه تلفظ انگلیسی</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'en-US' as EnglishAccent, label: 'آمریکایی' },
                { id: 'en-GB' as EnglishAccent, label: 'بریتانیایی' },
                { id: 'en-AU' as EnglishAccent, label: 'استرالیایی' },
              ].map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setAccent(acc.id)}
                  className={`py-2 px-2 text-xs font-medium rounded-xl transition-all ${
                    accent === acc.id
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 ring-1 ring-amber-400'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                  }`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Story Style */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              سبک و لحن داستان‌سرایی
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'playful' as StoryStyle, label: 'شاد و بازیگوش' },
                { id: 'adventure' as StoryStyle, label: 'ماجراجویی و کشف' },
                { id: 'bedtime' as StoryStyle, label: 'آرامش قبل از خواب' },
                { id: 'everyday' as StoryStyle, label: 'زندگی روزمره' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStyle(st.id)}
                  className={`py-2 px-2.5 text-xs font-medium rounded-xl text-center transition-all ${
                    style === st.id
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 ring-1 ring-emerald-400'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Length & Vocab Sliders */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                طول داستان: {length === 'short' ? 'کوتاه' : length === 'medium' ? 'متوسط' : 'بلند'}
              </label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value as StoryLength)}
                className="w-full text-xs p-2 rounded-xl bg-stone-100 dark:bg-stone-800 border-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="short">کوتاه (~۶۰ کلمه)</option>
                <option value="medium">متوسط (~۱۲۰ کلمه)</option>
                <option value="long">بلند (~۲۰۰ کلمه)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                تعداد واژگان کلیدی: {vocabCount}
              </label>
              <select
                value={vocabCount}
                onChange={(e) => setVocabCount(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-xl bg-stone-100 dark:bg-stone-800 border-none focus:ring-1 focus:ring-amber-500"
              >
                <option value={6}>۶ کلمه</option>
                <option value={8}>۸ کلمه</option>
                <option value={10}>۱۰ کلمه</option>
              </select>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-3">
            <button
              onClick={handleStartAnalysis}
              disabled={!selectedImage || isAnalyzing || isCompressing}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                !selectedImage || isAnalyzing || isCompressing
                  ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white hover:from-amber-600 hover:to-indigo-700 hover:scale-[1.01] shadow-amber-500/20'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>در حال تحلیل و تولید درس...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>شروع تحلیل هوشمند و خلق درس</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Animated Step-by-Step Pedagogical Loading Modal */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl p-8 border border-amber-200/50 dark:border-stone-800 shadow-2xl text-center space-y-6">
            
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 animate-spin">
                <Sparkles className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                در حال پردازش هوشمند صفحه کتاب
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                هوش مصنوعی در حال تحلیل لایه‌های آموزشی تصویر است...
              </p>
            </div>

            {/* Stepper list */}
            <div className="space-y-3 text-right">
              {pedagogicalSteps.map((stepText, idx) => {
                const isPassed = idx < activeStep;
                const isCurrent = idx === activeStep;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-bold'
                        : isPassed
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-stone-400 dark:text-stone-600'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0">
                      {isPassed ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-700" />
                      )}
                    </div>
                    <span className="text-xs leading-tight">{stepText}</span>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
