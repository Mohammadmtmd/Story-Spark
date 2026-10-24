import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  BookOpen,
  Volume2,
  Trophy,
} from 'lucide-react';
import type { Lesson, QuizQuestion } from '../types';
import { speakEnglish } from '../services/ttsService';

interface QuizArenaViewProps {
  lessons: Lesson[];
  selectedLesson: Lesson | null;
  onSelectLesson: (lesson: Lesson | null) => void;
}

export const QuizArenaView: React.FC<QuizArenaViewProps> = ({
  lessons,
  selectedLesson,
  onSelectLesson,
}) => {
  // If no lesson explicitly chosen, default to the first available or aggregate
  const activeLesson = selectedLesson || (lessons.length > 0 ? lessons[0] : null);
  const questions: QuizQuestion[] = activeLesson?.questions || [];

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const currentQ = questions[currentIndex] || null;

  const handleSelect = (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
    setIsAnswered(true);

    const isCorrect = answer === currentQ.correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + (currentQ.points || 10));
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  };

  const handleNext = () => {
    if (currentIndex >= questions.length - 1) {
      setIsFinished(true);
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
      });
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  if (!activeLesson || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-4">
        <Award className="w-12 h-12 mx-auto text-amber-500" />
        <h2 className="text-lg font-bold text-stone-800 dark:text-stone-200">
          هنوز سوالی برای آزمون در حافظه وجود ندارد
        </h2>
        <p className="text-xs text-stone-500">
          ابتدا یک درس را از صفحه کتاب داستان تحلیل کنید یا از بخش پشتیبان درس نمونه را بارگذاری نمایید.
        </p>
      </div>
    );
  }

  const maxScore = questions.reduce((acc, q) => acc + (q.points || 10), 0);
  const percentage = Math.round((score / (maxScore || 1)) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Lesson Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
            انتخاب درس برای آزمون:
          </span>
        </div>
        <select
          value={activeLesson.id}
          onChange={(e) => {
            const l = lessons.find((item) => item.id === e.target.value) || null;
            onSelectLesson(l);
            handleRestart();
          }}
          className="text-xs p-2 rounded-xl bg-stone-100 dark:bg-stone-800 border-none font-en"
        >
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.titleEn} ({l.titleFa})
            </option>
          ))}
        </select>
      </div>

      {/* FINISHED REPORT CARD */}
      {isFinished ? (
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-stone-900 border-2 border-amber-300 dark:border-stone-800 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
              کارنامه آزمون شاداب StorySpark
            </h2>
            <p className="text-xs text-stone-500">
              آزمون درس «{activeLesson.titleFa}» با موفقیت به پایان رسید!
            </p>
          </div>

          {/* Score display */}
          <div className="p-6 rounded-2xl bg-amber-50 dark:bg-stone-800/60 max-w-sm mx-auto space-y-2">
            <div className="text-4xl font-black font-en text-amber-600 dark:text-amber-400 tabular-nums">
              {percentage}%
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-300">
              امتیاز کسب‌شده: {score} از {maxScore}
            </div>
          </div>

          <div className="text-sm font-medium text-stone-700 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
            {percentage >= 80
              ? '🌟 شگفت‌انگیز! تسلط شما بر واژگان و مفهوم این درس فوق‌العاده است. آفرین قهرمان!'
              : percentage >= 50
              ? '👏 بسیار خوب! با یک بار مرور دیگر در جعبه لایتنر، امتیاز ۱۰۰٪ در انتظار شماست.'
              : '💪 تلاش خوبی بود! فلش‌کارت‌های این درس را دوباره مرور کن تا کلمات ملکه ذهنت شوند.'}
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>تکرار آزمون</span>
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE QUESTION CARD */
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-md space-y-6">
          
          {/* Header Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>
                سوال {currentIndex + 1} از {questions.length}
              </span>
              <span className="font-bold text-amber-600 tabular-nums">
                امتیاز: {score}
              </span>
            </div>
            <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Prompt */}
          <div className="space-y-2 py-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-en text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 leading-snug">
                {currentQ.questionEn}
              </h3>
              <button
                onClick={() => speakEnglish(currentQ.questionEn, activeLesson.accent)}
                className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-100 shrink-0"
                title="شنیدن سوال"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {currentQ.questionFa}
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(currentQ.options || ['True (درست)', 'False (نادرست)']).map((opt, idx) => {
              const isChosen = selectedAnswer === opt;
              const isCorrect = opt === currentQ.correctAnswer;

              let style = 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700/60 border border-stone-200/60 dark:border-stone-700';

              if (isAnswered) {
                if (isCorrect) {
                  style = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-2 border-emerald-500 font-bold';
                } else if (isChosen && !isCorrect) {
                  style = 'bg-red-100 dark:bg-red-950/80 text-red-900 dark:text-red-200 border-2 border-red-500 line-through';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(opt)}
                  disabled={isAnswered}
                  className={`p-4 rounded-2xl text-xs sm:text-sm font-en transition-all flex items-center justify-between text-right sm:text-center ${style}`}
                >
                  <span>{opt}</span>
                  {isAnswered && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                  {isAnswered && isChosen && !isCorrect && <XCircle className="w-4 h-4 text-red-600" />}
                </button>
              );
            })}
          </div>

          {/* Feedback Explanation & Next Button */}
          {isAnswered && (
            <div className="space-y-4 pt-2 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-bold">راهنمای آموزشی:</div>
                <div className="leading-relaxed">{currentQ.explanationFa}</div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all"
                >
                  <span>سوال بعدی</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
