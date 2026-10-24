import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Eye,
  Layers,
  Award,
  FileDown,
  Volume2,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Play,
  RotateCcw,
  Check,
} from 'lucide-react';
import type { Lesson, VocabularyItem } from '../types';
import { speakEnglish, stopSpeaking } from '../services/ttsService';
import { exportLessonToWordDoc } from '../services/exportService';

interface LessonDetailModalProps {
  lesson: Lesson;
  onClose: () => void;
  onStartQuiz: (lesson: Lesson) => void;
}

export const LessonDetailModal: React.FC<LessonDetailModalProps> = ({
  lesson,
  onClose,
  onStartQuiz,
}) => {
  const [activeTab, setActiveTab] = useState<'story' | 'scene' | 'vocab' | 'quiz' | 'worksheet'>('story');
  const [speechSpeed, setSpeechSpeed] = useState<number>(0.9);
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Quick practice quiz state in modal
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});

  const handleSpeak = (text: string, id: string) => {
    setPlayingWord(id);
    speakEnglish(text, lesson.accent || 'en-US', speechSpeed, () => {
      setPlayingWord(null);
    });
  };

  const handleExportWord = async () => {
    setIsExporting(true);
    try {
      await exportLessonToWordDoc(lesson);
    } catch (e) {
      console.error('Word export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectAnswer = (qId: string, answer: string) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: answer }));
    setShowExplanation((prev) => ({ ...prev, [qId]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-4 bg-amber-50/40 dark:bg-stone-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 font-en line-clamp-1">
                {lesson.titleEn}
              </h2>
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                <span>{lesson.titleFa}</span>
                <span>·</span>
                <span className="font-en">{lesson.cefrLevel}</span>
                <span>·</span>
                <span>{lesson.ageLevel} سال</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportWord}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">دانلود برگه Word</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-1 overflow-x-auto px-4 sm:px-6 py-2.5 bg-stone-50 dark:bg-stone-950/40 border-b border-stone-200/50 dark:border-stone-800 shrink-0 scrollbar-none">
          {[
            { id: 'story', label: 'داستان و ترجمه موازی', icon: BookOpen },
            { id: 'scene', label: 'تحلیل صحنه و مشاهدات', icon: Eye },
            { id: 'vocab', label: `واژگان و آواشناسی (${lesson.vocabulary.length})`, icon: Layers },
            { id: 'quiz', label: `تمرین درک مطلب (${lesson.questions.length})`, icon: Award },
            { id: 'worksheet', label: 'برگه چاپی و ممیزی', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: STORY & PARALLEL TRANSLATION */}
          {activeTab === 'story' && (
            <div className="space-y-6">
              
              {/* Playback speed controls bar */}
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                  <Volume2 className="w-4 h-4 text-amber-500" />
                  <span>تنظیم سرعت تلفظ صوتی:</span>
                </div>
                <div className="flex items-center gap-1.5 font-en">
                  <button
                    onClick={() => setSpeechSpeed(0.75)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      speechSpeed === 0.75
                        ? 'bg-amber-500 text-white'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    0.75x (آرام)
                  </button>
                  <button
                    onClick={() => setSpeechSpeed(0.95)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      speechSpeed === 0.95
                        ? 'bg-amber-500 text-white'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    1.0x (طبیعی)
                  </button>
                </div>
              </div>

              {/* Story Paragraphs Split View */}
              <div className="space-y-4">
                {(lesson.storyParagraphs || [{ en: lesson.storyEn, fa: lesson.storyFa }]).map((p, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="font-en text-base sm:text-lg text-stone-900 dark:text-stone-100 font-medium leading-relaxed">
                        {p.en}
                      </div>
                      <button
                        onClick={() => handleSpeak(p.en, `para-${idx}`)}
                        className={`p-2 rounded-xl shrink-0 transition-colors ${
                          playingWord === `para-${idx}`
                            ? 'bg-amber-500 text-white animate-pulse'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-100'
                        }`}
                        title="پخش صوتی این بند"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
                      {p.fa}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 2: SCENE ANALYSIS & OBSERVATIONS */}
          {activeTab === 'scene' && (
            <div className="space-y-6">
              
              {/* Setting Overview */}
              <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-stone-800/50 border border-amber-200/60 dark:border-stone-800 space-y-2">
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-amber-600" />
                  <span>محیط و فضاسازی تصویر (Setting)</span>
                </h3>
                <div className="font-en text-sm font-semibold text-stone-800 dark:text-stone-200">
                  {lesson.backgroundAndSetting.settingEn}
                </div>
                <div className="text-xs text-stone-600 dark:text-stone-300">
                  {lesson.backgroundAndSetting.settingFa}
                </div>
                {lesson.backgroundAndSetting.visualDetailsFa && (
                  <div className="text-xs text-stone-500 dark:text-stone-400 pt-1 border-t border-amber-200/40 dark:border-stone-700">
                    جزئیات بصری: {lesson.backgroundAndSetting.visualDetailsFa}
                  </div>
                )}
              </div>

              {/* Detected Items Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  اشیای کشف‌شده و موقعیت فضایی در صفحه
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lesson.detectedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-en font-bold text-sm text-stone-900 dark:text-stone-100">
                          {item.itemEn}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          تعداد: {item.count} {item.countEstimated ? '(تقریبی)' : ''}
                        </span>
                      </div>
                      <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                        معادل فارسی: {item.itemFa}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800">
                        <span>رنگ: {item.color}</span>
                        <span>موقعیت: {item.locationFa}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observable Actions */}
              {lesson.observableActions && lesson.observableActions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    کنش‌ها و رفتارهای دیداری در تصویر
                  </h3>
                  <div className="space-y-2">
                    {lesson.observableActions.map((act, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800 flex items-center justify-between gap-4 text-xs"
                      >
                        <span className="font-en font-semibold text-stone-800 dark:text-stone-200">
                          {act.actionEn}
                        </span>
                        <span className="text-stone-600 dark:text-stone-400">
                          {act.actionFa}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visible Printed Text on Book Page */}
              {lesson.visibleTextOnPage && (
                <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800/60 text-xs space-y-1">
                  <div className="font-bold text-stone-700 dark:text-stone-300">
                    متن اصلی چاپ‌شده روی صفحه کتاب:
                  </div>
                  <div className="font-en text-stone-800 dark:text-stone-200 italic">
                    "{lesson.visibleTextOnPage}"
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: TARGET VOCABULARY & PHONICS */}
          {activeTab === 'vocab' && (
            <div className="space-y-6">
              
              {/* Phonics Focus Card */}
              {lesson.phonicsSound && (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black font-en bg-white text-amber-600 w-10 h-10 rounded-2xl flex items-center justify-center">
                        {lesson.phonicsSound.letter}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-amber-100">صدای آواشناسی هدف (Phonics Sound)</div>
                        <div className="text-lg font-bold font-en">{lesson.phonicsSound.ipa}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSpeak(lesson.phonicsSound.letter, 'phonics-focus')}
                      className="p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                      title="پخش صدای حرف"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-xs text-amber-100/95 leading-relaxed">
                    {lesson.phonicsSound.explanationFa}
                  </p>

                  <div className="pt-2 border-t border-white/20 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-amber-100 font-semibold">کلمات نمونه:</span>
                    {lesson.phonicsSound.sampleWords.map((w, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSpeak(w, `sample-${idx}`)}
                        className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-en font-bold transition-all flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{w}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vocabulary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lesson.vocabulary.map((vocab) => (
                  <div
                    key={vocab.id}
                    className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold font-en text-stone-900 dark:text-stone-100">
                          {vocab.word}
                        </span>
                        <span className="text-xs text-stone-400 font-en">
                          {vocab.ipa}
                        </span>
                      </div>
                      <button
                        onClick={() => handleSpeak(vocab.word, vocab.id)}
                        className={`p-2 rounded-xl transition-colors ${
                          playingWord === vocab.id
                            ? 'bg-amber-500 text-white animate-pulse'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-100'
                        }`}
                        title="پخش تلفظ صوتی"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {vocab.meaningFa}
                      </span>
                      <span className="text-stone-500 font-medium">
                        راهنمای خواندن فارسی: «{vocab.pronunciationGuideFa}»
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 space-y-1 text-xs">
                      <div className="font-en text-stone-800 dark:text-stone-200 font-medium">
                        {vocab.exampleEn}
                      </div>
                      <div className="text-stone-500 dark:text-stone-400">
                        {vocab.exampleFa}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 4: INTERACTIVE PRACTICE QUIZ */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    تمرین‌های درک مطلب و ارزیابی یادگیری
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    برای بررسی پاسخ صحیح و مشاهده راهنمای آموزشی فارسی روی گزینه‌ها کلیک کنید.
                  </p>
                </div>
                <button
                  onClick={() => onStartQuiz(lesson)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Award className="w-4 h-4" />
                  <span>اجرا در میدان آزمون شاداب</span>
                </button>
              </div>

              <div className="space-y-4">
                {lesson.questions.map((q, idx) => {
                  const selected = userAnswers[q.id];
                  const isAnswered = !!selected;
                  const isCorrect = selected === q.correctAnswer;

                  return (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                            سوال شماره {idx + 1} ({q.type === 'multiple_choice' ? 'چهارگزینه‌ای' : q.type === 'true_false' ? 'درست / نادرست' : q.type === 'fill_blank' ? 'جای خالی' : q.type === 'phonics_match' ? 'آواشناسی' : 'مرتب‌سازی حروف'})
                          </div>
                          <div className="font-en text-base font-bold text-stone-900 dark:text-stone-100">
                            {q.questionEn}
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400">
                            {q.questionFa}
                          </div>
                        </div>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {(q.options || ['True (درست)', 'False (نادرست)']).map((opt, oIdx) => {
                          const isOptionSelected = selected === opt;
                          const isOptionCorrect = opt === q.correctAnswer;

                          let btnStyle = 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100';
                          if (isAnswered) {
                            if (isOptionCorrect) {
                              btnStyle = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-2 border-emerald-500 font-bold';
                            } else if (isOptionSelected && !isCorrect) {
                              btnStyle = 'bg-red-100 dark:bg-red-950/80 text-red-900 dark:text-red-200 border-2 border-red-500 line-through';
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleSelectAnswer(q.id, opt)}
                              className={`p-3 rounded-xl text-xs font-en text-right sm:text-center transition-all ${btnStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation feedback */}
                      {showExplanation[q.id] && (
                        <div
                          className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                            isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold">
                              {isCorrect ? 'آفرین! پاسخ کاملاً درست است.' : 'نیاز به دقت بیشتر!'}
                            </div>
                            <div className="pt-0.5 text-[11px] leading-relaxed">
                              {q.explanationFa}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 5: WORKSHEET PREVIEW & AUDIT */}
          {activeTab === 'worksheet' && (
            <div className="space-y-6">
              
              {/* Pedagogical Quality Audit Card */}
              {lesson.audit && (
                <div className="p-6 rounded-3xl bg-indigo-50 dark:bg-stone-800/80 border border-indigo-100 dark:border-stone-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                        ممیزی و گزارش کیفیت پداگوژیک درس
                      </h3>
                    </div>
                    <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums font-en">
                      {lesson.audit.totalScore} / 100
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-indigo-100 dark:border-stone-800">
                      <div className="text-[11px] text-stone-500">پوشش واژگان</div>
                      <div className="text-base font-bold text-stone-800 dark:text-stone-200 tabular-nums">
                        {lesson.audit.vocabCoverageScore}%
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-indigo-100 dark:border-stone-800">
                      <div className="text-[11px] text-stone-500">اعتبار سوالات</div>
                      <div className="text-base font-bold text-stone-800 dark:text-stone-200 tabular-nums">
                        {lesson.audit.questionValidityScore}%
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-indigo-100 dark:border-stone-800">
                      <div className="text-[11px] text-stone-500">سلامت ترجمه</div>
                      <div className="text-base font-bold text-stone-800 dark:text-stone-200 tabular-nums">
                        {lesson.audit.translationIntegrityScore}%
                      </div>
                    </div>
                  </div>

                  {lesson.audit.notesFa && lesson.audit.notesFa.length > 0 && (
                    <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
                      {lesson.audit.notesFa.map((note, nIdx) => (
                        <div key={nIdx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{note}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Printable Worksheet Preview Paper */}
              <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 shadow-lg space-y-6 max-w-3xl mx-auto font-sans">
                
                <div className="text-center pb-4 border-b border-stone-200 dark:border-stone-800 space-y-1">
                  <div className="text-xs uppercase tracking-wider text-amber-600 font-bold font-en">
                    StorySpark Pedagogical Learning Worksheet
                  </div>
                  <h1 className="text-xl font-bold font-en text-stone-900 dark:text-stone-100">
                    {lesson.titleEn}
                  </h1>
                  <div className="text-xs text-stone-500">
                    نام زبان‌آموز: ____________________ · تاریخ: ____________________
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    1. Read the Story / داستان را با دقت بخوانید:
                  </h4>
                  <p className="font-en text-sm leading-relaxed text-stone-800 dark:text-stone-200 bg-stone-50 dark:bg-stone-800/40 p-4 rounded-2xl">
                    {lesson.storyEn}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    2. Vocabulary Focus / واژگان کلیدی:
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-en">
                    {lesson.vocabulary.slice(0, 6).map((v, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 flex justify-between">
                        <span className="font-bold">{v.word}</span>
                        <span className="text-stone-500 font-sans">{v.meaningFa}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    3. Practice Questions / به سوالات زیر پاسخ دهید:
                  </h4>
                  {lesson.questions.slice(0, 3).map((q, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="font-en font-medium">Q{idx + 1}: {q.questionEn}</div>
                      <div className="text-stone-400 font-mono">Answer: ________________________________________________</div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleExportWord}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>دانلود فایل آماده پرینت Word (.docx)</span>
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
