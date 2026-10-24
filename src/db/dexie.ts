import Dexie, { type Table } from 'dexie';
import type { Lesson, VocabularyItem, AISettings, SupabaseConfig } from '../types';

export class StorySparkDatabase extends Dexie {
  lessons!: Table<Lesson, string>;
  vocabulary!: Table<VocabularyItem, string>;
  settings!: Table<{ id: string; data: AISettings | SupabaseConfig }, string>;

  constructor() {
    super('StorySparkDB');
    this.version(1).stores({
      lessons: 'id, titleEn, ageLevel, cefrLevel, createdAt',
      vocabulary: 'id, lessonId, word, masteryLevel, nextReviewDate, easeFactor, intervalDays',
      settings: 'id',
    });
  }
}

export const db = new StorySparkDatabase();

/**
 * SuperMemo SM-2 Spaced Repetition calculation
 * Rating values:
 * 'again' = 1 (complete blackout, reset repetitions)
 * 'hard'  = 2 (recalled with serious difficulty)
 * 'good'  = 3 (recalled after a moment, correct)
 * 'easy'  = 4 (perfect immediate recall)
 */
export function calculateSM2(
  card: VocabularyItem,
  rating: 'again' | 'hard' | 'good' | 'easy'
): Partial<VocabularyItem> {
  const currentRepetitions = card.repetitions || 0;
  let currentEF = card.easeFactor || 2.5;
  let currentInterval = card.intervalDays || 0;

  let newRepetitions = currentRepetitions;
  let newInterval = currentInterval;
  let newMastery: VocabularyItem['masteryLevel'] = card.masteryLevel || 'new';

  if (rating === 'again') {
    newRepetitions = 0;
    newInterval = 1;
    newMastery = 'learning';
    currentEF = Math.max(1.3, currentEF - 0.2);
  } else if (rating === 'hard') {
    newRepetitions = Math.max(1, currentRepetitions);
    newInterval = Math.max(1, Math.round(currentInterval * 1.2) || 1);
    currentEF = Math.max(1.3, currentEF - 0.15);
    newMastery = 'learning';
  } else if (rating === 'good') {
    if (currentRepetitions === 0) {
      newInterval = 1;
    } else if (currentRepetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * currentEF);
    }
    newRepetitions = currentRepetitions + 1;
    currentEF = Math.max(1.3, currentEF + 0.05);
    newMastery = newRepetitions >= 3 ? 'review' : 'learning';
  } else if (rating === 'easy') {
    if (currentRepetitions === 0) {
      newInterval = 4;
    } else if (currentRepetitions === 1) {
      newInterval = 8;
    } else {
      newInterval = Math.round(currentInterval * currentEF * 1.3);
    }
    newRepetitions = currentRepetitions + 1;
    currentEF = Math.min(3.0, currentEF + 0.15);
    newMastery = newRepetitions >= 3 ? 'mastered' : 'review';
  }

  if (newInterval >= 15 && newRepetitions >= 4) {
    newMastery = 'mastered';
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  return {
    repetitions: newRepetitions,
    intervalDays: newInterval,
    easeFactor: Number(currentEF.toFixed(2)),
    nextReviewDate: nextDate.toISOString(),
    masteryLevel: newMastery,
    lastReviewed: new Date().toISOString(),
  };
}

/**
 * High-quality sample children's book lesson for immediate demonstration
 */
export const SAMPLE_LESSONS: Lesson[] = [
  {
    id: 'demo-forest-friends-101',
    titleEn: 'The Little Fox in the Magic Woods',
    titleFa: 'روباه کوچولو در جنگل جادویی',
    ageLevel: '6-8',
    cefrLevel: 'A1',
    accent: 'en-US',
    style: 'playful',
    length: 'medium',
    imageThumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23fef3c7"/><circle cx="200" cy="150" r="80" fill="%23f97316"/><path d="M160 110 L190 70 L210 110 Z" fill="%23ea580c"/><path d="M210 110 L230 70 L260 110 Z" fill="%23ea580c"/><circle cx="180" cy="140" r="8" fill="%231e293b"/><circle cx="220" cy="140" r="8" fill="%231e293b"/><polygon points="200,160 190,175 210,175" fill="%231e293b"/><text x="50%" y="260" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23b45309" text-anchor="middle">StorySpark Demo: Rusty the Fox</text></svg>',
    detectedItems: [
      { itemEn: 'red fox', itemFa: 'روباه قرمز', certainty: 'certain', count: 1, countEstimated: false, color: 'orange and white', locationFa: 'مرکز تصویر' },
      { itemEn: 'tall oak tree', itemFa: 'درخت بلوط بلند', certainty: 'certain', count: 3, countEstimated: false, color: 'deep green', locationFa: 'سمت چپ پس‌زمینه' },
      { itemEn: 'golden acorns', itemFa: 'بلوط‌های طلایی', certainty: 'probable', count: 5, countEstimated: true, color: 'golden brown', locationFa: 'روی زمین چمن' },
      { itemEn: 'wooden basket', itemFa: 'سبد چوبی', certainty: 'certain', count: 1, countEstimated: false, color: 'light brown', locationFa: 'کنار پای روباه' },
      { itemEn: 'blue butterfly', itemFa: 'پروانه آبی', certainty: 'certain', count: 1, countEstimated: false, color: 'bright blue', locationFa: 'بالای سر روباه در هوا' }
    ],
    observableActions: [
      { actionEn: 'Rusty is holding a little basket', actionFa: 'راستی یک سبد کوچک در دست دارد' },
      { actionEn: 'The butterfly is fluttering softly', actionFa: 'پروانه با آرامش بال بال می‌زند' },
      { actionEn: 'Acorns are dropping from the branches', actionFa: 'بلوط‌ها از شاخه‌ها به زمین می‌افتند' }
    ],
    backgroundAndSetting: {
      settingEn: 'A sunlit fairy tale woodland glade during autumn',
      settingFa: 'یک دشت آفتابی و رویایی جنگلی در فصل پاییز',
      visualDetailsFa: 'برگ‌های زرد و نارنجی روی زمین، پرتوهای ملایم خورشید بین شاخه‌های درختان و سبزه باطراوت.'
    },
    visibleTextOnPage: 'Chapter 2: Rusty finds a secret trail near the hollow tree.',
    isLegible: true,
    storyEn: 'Once upon a time in a sunny green forest, Rusty the friendly little fox woke up with a big smile. He picked up his brown wooden basket and stepped into the soft grass. A gentle blue butterfly danced in the air right above his nose! "Good morning, fluttery friend!" Rusty laughed cheerfully. Underneath the tall oak tree, he discovered shiny golden acorns scattered like hidden treasure. Rusty placed three small acorns in his basket to share with his grandmother.',
    storyFa: 'یکی بود یکی نبود، در یک جنگل سبز و آفتابی، روباه مهربانی به نام «راستی» با لبخندی بزرگ از خواب بیدار شد. او سبد چوبی قهوه‌ای رنگش را برداشت و روی چمن‌های نرم قدم گذاشت. یک پروانه آبی و ملایم درست بالای بینی‌اش در هوا رقصید! راستی با خوشحالی خندید و گفت: «صبح بخیر دوست بال‌بالی من!» زیر درخت بلوط بلند، او بلوط‌های طلایی و براقی را دید که مثل گنج‌های مخفی روی زمین پخش شده بودند. راستی سه بلوط کوچک را در سبدش گذاشت تا آن‌ها را با مادربزرگش سهیم شود.',
    storyParagraphs: [
      {
        en: 'Once upon a time in a sunny green forest, Rusty the friendly little fox woke up with a big smile. He picked up his brown wooden basket and stepped into the soft grass.',
        fa: 'یکی بود یکی نبود، در یک جنگل سبز و آفتابی، روباه مهربانی به نام «راستی» با لبخندی بزرگ از خواب بیدار شد. او سبد چوبی قهوه‌ای رنگش را برداشت و روی چمن‌های نرم قدم گذاشت.'
      },
      {
        en: 'A gentle blue butterfly danced in the air right above his nose! "Good morning, fluttery friend!" Rusty laughed cheerfully.',
        fa: 'یک پروانه آبی و ملایم درست بالای بینی‌اش در هوا رقصید! راستی با خوشحالی خندید و گفت: «صبح بخیر دوست بال‌بالی من!»'
      },
      {
        en: 'Underneath the tall oak tree, he discovered shiny golden acorns scattered like hidden treasure. Rusty placed three small acorns in his basket to share with his grandmother.',
        fa: 'زیر درخت بلوط بلند، او بلوط‌های طلایی و براقی را دید که مثل گنج‌های مخفی روی زمین پخش شده بودند. راستی سه بلوط کوچک را در سبدش گذاشت تا آن‌ها را با مادربزرگش سهیم شود.'
      }
    ],
    vocabulary: [
      {
        id: 'voc-1',
        lessonId: 'demo-forest-friends-101',
        word: 'fox',
        meaningFa: 'روباه',
        partOfSpeech: 'noun',
        ipa: '/fɑːks/',
        pronunciationGuideFa: 'فاکس',
        exampleEn: 'The smart fox has a bushy tail.',
        exampleFa: 'روباه باهوش دمی پرپشت دارد.',
        difficulty: 'easy',
        category: 'Animals',
        inStory: true,
        repetitions: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewDate: new Date().toISOString(),
        masteryLevel: 'new'
      },
      {
        id: 'voc-2',
        lessonId: 'demo-forest-friends-101',
        word: 'basket',
        meaningFa: 'سبد',
        partOfSpeech: 'noun',
        ipa: '/ˈbæs.kɪt/',
        pronunciationGuideFa: 'بَس‌کیت',
        exampleEn: 'Put the red apples into the basket.',
        exampleFa: 'سیب‌های قرمز را داخل سبد بگذار.',
        difficulty: 'easy',
        category: 'Objects',
        inStory: true,
        repetitions: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewDate: new Date().toISOString(),
        masteryLevel: 'new'
      },
      {
        id: 'voc-3',
        lessonId: 'demo-forest-friends-101',
        word: 'butterfly',
        meaningFa: 'پروانه',
        partOfSpeech: 'noun',
        ipa: '/ˈbʌt.ɚ.flaɪ/',
        pronunciationGuideFa: 'باتِرفلای',
        exampleEn: 'A blue butterfly landed on the blossom.',
        exampleFa: 'یک پروانه آبی روی شکوفه نشست.',
        difficulty: 'medium',
        category: 'Insects',
        inStory: true,
        repetitions: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewDate: new Date().toISOString(),
        masteryLevel: 'new'
      },
      {
        id: 'voc-4',
        lessonId: 'demo-forest-friends-101',
        word: 'acorn',
        meaningFa: 'بلوط (میوه بلوط)',
        partOfSpeech: 'noun',
        ipa: '/ˈeɪ.kɔːrn/',
        pronunciationGuideFa: 'اِی‌کورن',
        exampleEn: 'The squirrel collected an acorn.',
        exampleFa: 'سنجاب یک دانه بلوط جمع کرد.',
        difficulty: 'medium',
        category: 'Nature',
        inStory: true,
        repetitions: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewDate: new Date().toISOString(),
        masteryLevel: 'new'
      },
      {
        id: 'voc-5',
        lessonId: 'demo-forest-friends-101',
        word: 'forest',
        meaningFa: 'جنگل',
        partOfSpeech: 'noun',
        ipa: '/ˈfɔːr.ɪst/',
        pronunciationGuideFa: 'فارِست',
        exampleEn: 'Birds sing sweetly in the quiet forest.',
        exampleFa: 'پرندگان با شیرینی در جنگل آرام آواز می‌خوانند.',
        difficulty: 'easy',
        category: 'Nature',
        inStory: true,
        repetitions: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewDate: new Date().toISOString(),
        masteryLevel: 'new'
      },
      {
        id: 'voc-6',
        lessonId: 'demo-forest-friends-101',
        word: 'smile',
        meaningFa: 'لبخند زدن / لبخند',
        partOfSpeech: 'verb / noun',
        ipa: '/smaɪl/',
        pronunciationGuideFa: 'اسمایل',
        exampleEn: 'Rusty always greets friends with a warm smile.',
        exampleFa: 'راستی همیشه با یک لبخند گرم به دوستان سلام می‌کند.',
        difficulty: 'easy',
        category: 'Feelings & Actions',
        inStory: true,
        repetitions: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewDate: new Date().toISOString(),
        masteryLevel: 'new'
      }
    ],
    phonicsSound: {
      letter: 'F',
      ipa: '/f/',
      explanationFa: 'صدای «ف» با گذاشتن دندان‌های بالا روی لب پایین و بیرون دمیدن ملایم هوا تولید می‌شود.',
      sampleWords: ['Fox', 'Forest', 'Friend', 'Flutter', 'Fast']
    },
    questions: [
      {
        id: 'q-1',
        type: 'multiple_choice',
        questionEn: 'What animal is Rusty?',
        questionFa: 'راستی چه حیوانی است؟',
        options: ['A friendly fox', 'A noisy bear', 'A tiny rabbit', 'A sleeping cat'],
        correctAnswer: 'A friendly fox',
        explanationFa: 'راستی یک روباه مهربان و باهوش در جنگل است.',
        points: 10
      },
      {
        id: 'q-2',
        type: 'true_false',
        questionEn: 'Rusty carried a metal bucket.',
        questionFa: 'راستی یک سطل فلزی حمل می‌کرد.',
        options: ['True (درست)', 'False (نادرست)'],
        correctAnswer: 'False (نادرست)',
        explanationFa: 'راستی یک سبد چوبی قهوه‌ای به همراه داشت، نه سطل فلزی.',
        points: 10
      },
      {
        id: 'q-3',
        type: 'fill_blank',
        questionEn: 'A gentle blue ________ danced in the air right above his nose.',
        questionFa: 'یک ________ ملایم آبی در هوا درست بالای بینی او رقصید.',
        options: ['butterfly', 'bird', 'airplane', 'bee'],
        correctAnswer: 'butterfly',
        explanationFa: 'پروانه (butterfly) بالای بینی روباه به پرواز درآمد.',
        points: 10
      },
      {
        id: 'q-4',
        type: 'phonics_match',
        questionEn: 'Which word starts with the /f/ phonics sound?',
        questionFa: 'کدام کلمه با صدای حرف /f/ آغاز می‌شود؟',
        options: ['Forest', 'Basket', 'Oak', 'Acorn'],
        correctAnswer: 'Forest',
        explanationFa: 'کلمه Forest با صدای /f/ شروع می‌شود.',
        points: 10
      },
      {
        id: 'q-5',
        type: 'unscramble',
        questionEn: 'Unscramble the letters: [o - x - f]',
        questionFa: 'حروف را مرتب کنید تا نام حیوان داستان ساخته شود: [o - x - f]',
        options: ['fox', 'box', 'fix', 'fog'],
        correctAnswer: 'fox',
        explanationFa: 'ترتیب درست حروف fox (روباه) است.',
        points: 10
      }
    ],
    audit: {
      vocabCoverageScore: 98,
      questionValidityScore: 100,
      translationIntegrityScore: 96,
      totalScore: 98,
      notesFa: [
        'تمام واژگان هدف درون داستان به کار رفته‌اند.',
        'تطابق سنی ۶ الی ۸ سال برای سطح A1 استاندارد است.',
        'ترجمه روان فارسی همراه با اصطلاحات کودکانه رعایت شده است.'
      ]
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

export async function loadSampleLessonIntoDB() {
  for (const sample of SAMPLE_LESSONS) {
    const existing = await db.lessons.get(sample.id);
    if (!existing) {
      await db.lessons.add(sample);
      for (const vocab of sample.vocabulary) {
        await db.vocabulary.put(vocab);
      }
    }
  }
}
