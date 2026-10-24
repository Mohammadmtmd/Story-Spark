import React from 'react';
import {
  HelpCircle,
  Camera,
  Sun,
  Layers,
  Award,
  FileDown,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const HelpGuideView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-amber-500" />
          <span>راهنمای جامع والدین و معلمان زبان انگلیسی</span>
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          اصول بهترین عکاسی از کتاب‌های داستان و متدولوژی پداگوژیک استودیوی هوشمند StorySpark
        </p>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card 1: Photography Tips */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            ۱. نکات طلایی عکاسی از صفحه کتاب
          </h3>
          <ul className="space-y-2.5 text-xs text-stone-600 dark:text-stone-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>نور طبیعی ملایم:</strong> از بازتاب مستقیم فلش روی صفحات گلاسه پرهیز کنید. نور روز کنار پنجره بهترین نتیجه را می‌دهد.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>زاویه موازی:</strong> گوشی را کاملاً موازی با صفحه کتاب بگیرید تا پرسپکتیو تصویر کج نشود.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>وضوح کاراکترها:</strong> مطمئن شوید تصویرسازی و نقاشی‌های صفحه به همراه متن به خوبی در کادر قرار گرفته‌اند.</span>
            </li>
          </ul>
        </div>

        {/* Card 2: CEFR & Age Levels */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            ۲. رده‌های سنی و سطوح استاندارد زبان
          </h3>
          <div className="space-y-2 text-xs text-stone-600 dark:text-stone-300">
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 space-y-1">
              <div className="font-bold text-amber-700 dark:text-amber-400">۳ تا ۵ سال (Pre-A1 Starters):</div>
              <div className="text-[11px]">تمرکز بر نام اشیا، رنگ‌ها، حیوانات، آواشناسی تک‌حرفی و جملات ۲ الی ۳ کلمه‌ای بسیار شاداب.</div>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 space-y-1">
              <div className="font-bold text-indigo-700 dark:text-indigo-400">۶ تا ۸ سال (A1 Movers):</div>
              <div className="text-[11px]">داستان‌های کوتاه داستانی، افعال ساده حال، سوالات چندگزینه‌ای و آواشناسی ترکیبی.</div>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 space-y-1">
              <div className="font-bold text-emerald-700 dark:text-emerald-400">۹ تا ۱۲ سال (A2 Flyers / B1):</div>
              <div className="text-[11px]">داستان‌های روایی پیچیده‌تر، زمان‌های گذشته، تمرین حروف به‌هم‌ریخته و درک مطلب پیشرفته.</div>
            </div>
          </div>
        </div>

        {/* Card 3: Leitner SM-2 */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            ۳. چگونه لایتنر SM-2 به یادگیری کمک می‌کند؟
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            سیستم SuperMemo SM-2 منحنی فراموشی ذهن انسان را محاسبه می‌کند. هر زمان کودک دکمه «آسان» را می‌زند، فاصله مرور بعدی چند روز بیشتر می‌شود، در حالی که کلمات فراموش‌شده بلافاصله در نوبت روز بعد قرار می‌گیرند تا بدون فشار روانی در حافظه دائمی ثبت شوند.
          </p>
        </div>

        {/* Card 4: Classroom Worksheets */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
            <FileDown className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            ۴. چاپ برگه‌های تمرین Word برای مدرسه و خانه
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            معلمان و مربیان می‌توانند تنها با کلیک روی «دانلود فایل Word»، برگه کار استاندارد چاپی درس را شامل متن داستان، جدول واژگان، بخش آواشناسی و خطوط پاسخگویی سوالات دریافت کرده و برای شاگردان کپی کنند.
          </p>
        </div>

      </div>

    </div>
  );
};
