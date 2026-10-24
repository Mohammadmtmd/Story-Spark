import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Layers,
  RotateCw,
  Volume2,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Search,
  Filter,
  Check,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import type { VocabularyItem, EnglishAccent } from '../types';
import { calculateSM2, db } from '../db/dexie';
import { speakEnglish } from '../services/ttsService';

interface VocabularyLeitnerViewProps {
  vocabulary: VocabularyItem[];
  onUpdateVocab: (updated: VocabularyItem) => void;
  preferredAccent: EnglishAccent;
}

export const VocabularyLeitnerView: React.FC<VocabularyLeitnerViewProps> = ({
  vocabulary,
  onUpdateVocab,
  preferredAccent,
}) => {
  const [viewMode, setViewMode] = useState<'study' | 'table'>('study');
  const [speechSpeed, setSpeechSpeed] = useState<number>(0.9);
  const [accent, setAccent] = useState<EnglishAccent>(preferredAccent);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableFilter, setTableFilter] = useState<string>('all');

  // Filter due cards for study mode
  const now = new Date();
  const dueCards = vocabulary.filter(
    (v) => !v.nextReviewDate || new Date(v.nextReviewDate) <= now
  );

  const currentCard = dueCards[currentIndex] || null;

  // Stats
  const totalCount = vocabulary.length;
  const masteredCount = vocabulary.filter((v) => v.masteryLevel === 'mastered').length;
  const reviewCount = vocabulary.filter((v) => v.masteryLevel === 'review').length;
  const learningCount = vocabulary.filter((v) => v.masteryLevel === 'learning').length;
  const newCount = vocabulary.filter((v) => v.masteryLevel === 'new').length;

  const handleSpeak = (text: string) => {
    speakEnglish(text, accent, speechSpeed);
  };

  const handleSM2Rating = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;

    const updates = calculateSM2(currentCard, rating);
    const updatedCard: VocabularyItem = {
      ...currentCard,
      ...updates,
    };

    // Update DB
    await db.vocabulary.put(updatedCard);
    onUpdateVocab(updatedCard);

    // If rated easy/good and mastered, launch mini confetti
    if (updatedCard.masteryLevel === 'mastered' && currentCard.masteryLevel !== 'mastered') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    }

    // Move to next card
    setIsFlipped(false);
    if (currentIndex >= dueCards.length - 1) {
      // Completed all due
      setCurrentIndex(0);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 },
      });
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Table filter
  const filteredTable = vocabulary.filter((item) => {
    const matchesSearch =
      item.word.toLowerCase().includes(tableSearch.toLowerCase()) ||
      item.meaningFa.includes(tableSearch);
    const matchesLevel = tableFilter === 'all' || item.masteryLevel === tableFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Title & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-500" />
            <span>جعبه واژگان و فلش‌کارت هوشمند لایتنر</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            بر اساس الگوریتم علمی SuperMemo SM-2 جهت انتقال واژگان به حافظه بلندمدت کودک
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('study')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              viewMode === 'study'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            حالت مرور فلش‌کارت
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            جدول واژگان ({totalCount})
          </button>
        </div>
      </div>

      {/* Leitner Progress Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-center">
          <div className="text-[11px] text-stone-500">نوبت مرور امروز</div>
          <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-0.5 tabular-nums">
            {dueCards.length}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-center">
          <div className="text-[11px] text-stone-500">واژگان جدید</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">
            {newCount}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-center">
          <div className="text-[11px] text-stone-500">در حال یادگیری</div>
          <div className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-0.5 tabular-nums">
            {learningCount}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-center">
          <div className="text-[11px] text-stone-500">مرحله تثبیت</div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 tabular-nums">
            {reviewCount}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-center col-span-2 sm:col-span-1">
          <div className="text-[11px] text-stone-500">تسلط کامل</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
            {masteredCount}
          </div>
        </div>
      </div>

      {/* MODE 1: 3D STUDY FLASHCARD */}
      {viewMode === 'study' ? (
        <div className="space-y-6">
          
          {/* Audio accent & speed settings bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-500">لهجه صدا:</span>
              <div className="flex items-center gap-1">
                {(['en-US', 'en-GB', 'en-AU'] as EnglishAccent[]).map((acc) => (
                  <button
                    key={acc}
                    onClick={() => setAccent(acc)}
                    className={`px-2 py-1 rounded-lg font-en font-medium transition-colors ${
                      accent === acc
                        ? 'bg-amber-500 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {acc}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-stone-500">سرعت پخش:</span>
              <div className="flex items-center gap-1 font-en">
                <button
                  onClick={() => setSpeechSpeed(0.75)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                    speechSpeed === 0.75
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  0.75x
                </button>
                <button
                  onClick={() => setSpeechSpeed(0.95)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                    speechSpeed === 0.95
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  1.0x
                </button>
              </div>
            </div>
          </div>

          {/* Flashcard Arena */}
          {dueCards.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-md space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">
                  همه کارت‌های نوبت امروز مرور شده‌اند!
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  کودک شما کلمات امروز را با موفقیت تمرین کرد. سیستم SM-2 طبق برنامه زمان‌بندی روزهای آینده واژگان را برای مرور یادآوری خواهد کرد.
                </p>
              </div>
            </div>
          ) : currentCard ? (
            <div className="space-y-5">
              
              <div className="text-center text-xs text-stone-400">
                کارت شماره {currentIndex + 1} از {dueCards.length}
              </div>

              {/* 3D Flip Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="perspective-1000 w-full min-h-[320px] cursor-pointer select-none"
              >
                <div
                  className={`relative w-full min-h-[320px] rounded-3xl transition-transform duration-500 transform-style-3d shadow-xl ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* FRONT SIDE (English Word + Audio) */}
                  <div className="absolute inset-0 backface-hidden rounded-3xl bg-white dark:bg-stone-900 border-2 border-amber-200/60 dark:border-stone-800 p-8 flex flex-col justify-between items-center text-center">
                    <div className="w-full flex items-center justify-between text-xs text-stone-400 font-en">
                      <span className="uppercase tracking-wider">{currentCard.category || 'Vocabulary'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-bold">
                        {currentCard.masteryLevel}
                      </span>
                    </div>

                    <div className="space-y-3 my-auto">
                      <div className="text-3xl sm:text-4xl font-extrabold font-en tracking-tight text-stone-900 dark:text-stone-100">
                        {currentCard.word}
                      </div>
                      <div className="text-base text-stone-500 dark:text-stone-400 font-en">
                        {currentCard.ipa}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSpeak(currentCard.word);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>شنیدن تلفظ انگلیسی</span>
                      </button>
                    </div>

                    <div className="text-xs text-stone-400 flex items-center gap-1.5">
                      <RotateCw className="w-3.5 h-3.5 text-amber-500" />
                      <span>برای دیدن معنی و مثال کلیک کنید</span>
                    </div>
                  </div>

                  {/* BACK SIDE (Persian Meaning + Pronunciation + Example) */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl bg-amber-50/90 dark:bg-stone-900 border-2 border-amber-300 dark:border-stone-700 p-8 flex flex-col justify-between items-center text-center">
                    <div className="w-full flex items-center justify-between text-xs text-stone-500">
                      <span className="font-en font-bold text-stone-700 dark:text-stone-300">{currentCard.word}</span>
                      <span className="text-amber-700 dark:text-amber-300 font-medium">پشت کارت</span>
                    </div>

                    <div className="space-y-3 my-auto max-w-md">
                      <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 dark:text-amber-400">
                        {currentCard.meaningFa}
                      </div>
                      <div className="text-xs text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-800 px-3 py-1.5 rounded-xl inline-block shadow-xs">
                        راهنمای خواندن فارسی: <span className="font-bold">«{currentCard.pronunciationGuideFa}»</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/70 dark:bg-stone-800/80 text-xs text-right space-y-1 border border-stone-200/60 dark:border-stone-700">
                        <div className="font-en font-medium text-stone-800 dark:text-stone-200">
                          {currentCard.exampleEn}
                        </div>
                        <div className="text-stone-500 dark:text-stone-400">
                          {currentCard.exampleFa}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-stone-400 flex items-center gap-1.5">
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>کلیک مجدد برای برگشت</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* SM-2 SuperMemo Rating Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <button
                  onClick={() => handleSM2Rating('again')}
                  className="p-3.5 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 font-bold text-xs transition-all flex flex-col items-center gap-1"
                >
                  <span>تکرار مجدد (Again)</span>
                  <span className="text-[10px] opacity-75 font-normal">یادم نبود · ۱ روز دیگر</span>
                </button>

                <button
                  onClick={() => handleSM2Rating('hard')}
                  className="p-3.5 rounded-2xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900 font-bold text-xs transition-all flex flex-col items-center gap-1"
                >
                  <span>سخت بود (Hard)</span>
                  <span className="text-[10px] opacity-75 font-normal">با تلاش یادم آمد</span>
                </button>

                <button
                  onClick={() => handleSM2Rating('good')}
                  className="p-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 font-bold text-xs transition-all flex flex-col items-center gap-1"
                >
                  <span>خوب (Good)</span>
                  <span className="text-[10px] opacity-75 font-normal">فاصله استاندارد</span>
                </button>

                <button
                  onClick={() => handleSM2Rating('easy')}
                  className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 font-bold text-xs transition-all flex flex-col items-center gap-1"
                >
                  <span>بسیار آسان (Easy)</span>
                  <span className="text-[10px] opacity-75 font-normal">جهش در لایتنر</span>
                </button>
              </div>

            </div>
          ) : null}

        </div>
      ) : (
        /* MODE 2: VOCABULARY OVERVIEW TABLE */
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-stone-400" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="جستجوی واژه یا معنی..."
                className="w-full pr-10 pl-4 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border-none"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="new">کلمات جدید (New)</option>
              <option value="learning">در حال یادگیری (Learning)</option>
              <option value="review">مرحله تثبیت (Review)</option>
              <option value="mastered">به تسلط رسیده (Mastered)</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="p-4">واژه (Word)</th>
                  <th className="p-4">IPA</th>
                  <th className="p-4">معنی فارسی</th>
                  <th className="p-4">راهنمای خواندن</th>
                  <th className="p-4">وضعیت تسلط</th>
                  <th className="p-4">مرور بعدی</th>
                  <th className="p-4 text-center">شنیدن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredTable.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/30 dark:hover:bg-stone-800/40">
                    <td className="p-4 font-bold font-en text-stone-900 dark:text-stone-100">
                      {item.word}
                    </td>
                    <td className="p-4 font-en text-stone-400">{item.ipa}</td>
                    <td className="p-4 text-amber-700 dark:text-amber-400 font-medium">
                      {item.meaningFa}
                    </td>
                    <td className="p-4 text-stone-500">{item.pronunciationGuideFa}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.masteryLevel === 'mastered'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.masteryLevel === 'review'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : item.masteryLevel === 'learning'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                            : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                        }`}
                      >
                        {item.masteryLevel}
                      </span>
                    </td>
                    <td className="p-4 text-stone-400 tabular-nums">
                      {item.nextReviewDate ? new Date(item.nextReviewDate).toLocaleDateString('fa-IR') : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleSpeak(item.word)}
                        className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 text-stone-600 dark:text-stone-300 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
