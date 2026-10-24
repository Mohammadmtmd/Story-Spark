/**
 * Document & Backup Export Service
 * Exports Word (.docx) worksheets, JSON backups, and card image captures.
 */

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
import type { Lesson } from '../types';
import { db } from '../db/dexie';

/**
 * Generate a printable Word (.docx) pedagogical worksheet for children & teachers
 */
export async function exportLessonToWordDoc(lesson: Lesson): Promise<void> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header / Title
          new Paragraph({
            text: `StorySpark English Learning Worksheet: ${lesson.titleEn}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `عنوان فارسی: ${lesson.titleFa} | `, bold: true }),
              new TextRun({ text: `گروه سنی: ${lesson.ageLevel} سال | ` }),
              new TextRun({ text: `سطح زبان: ${lesson.cefrLevel} | ` }),
              new TextRun({ text: `لهجه: ${lesson.accent}` }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Section 1: Story
          new Paragraph({
            text: '1. Reading Story / متن داستان',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: lesson.storyEn,
                size: 24, // 12pt
              }),
            ],
            spacing: { after: 180 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `ترجمه روان فارسی:\n${lesson.storyFa}`,
                italics: true,
                size: 20, // 10pt
                color: '4B5563',
              }),
            ],
            spacing: { after: 300 },
          }),

          // Section 2: Target Vocabulary
          new Paragraph({
            text: '2. Target Vocabulary / واژگان کلیدی',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Word', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'IPA / تلفظ', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'معنی فارسی', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Example / مثال', bold: true })] })] }),
                ],
              }),
              ...lesson.vocabulary.map(
                (v) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: v.word, bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ text: `${v.ipa} (${v.pronunciationGuideFa})` })] }),
                      new TableCell({ children: [new Paragraph({ text: v.meaningFa })] }),
                      new TableCell({ children: [new Paragraph({ text: v.exampleEn })] }),
                    ],
                  })
              ),
            ],
          }),

          // Section 3: Phonics Focus
          new Paragraph({
            text: `3. Phonics Sound Focus / آواشناسی: Letter [${lesson.phonicsSound.letter}]`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `IPA: ${lesson.phonicsSound.ipa} | `, bold: true }),
              new TextRun({ text: `توضیح تلفظ: ${lesson.phonicsSound.explanationFa}\n` }),
              new TextRun({ text: `کلمات نمونه: ${lesson.phonicsSound.sampleWords.join(', ')}`, bold: true, color: '1D4ED8' }),
            ],
            spacing: { after: 300 },
          }),

          // Section 4: Comprehension Practice Exercises
          new Paragraph({
            text: '4. Comprehension Questions / سوالات درک مطلب',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 },
          }),
          ...lesson.questions.flatMap((q, idx) => [
            new Paragraph({
              children: [
                new TextRun({ text: `Q${idx + 1}: ${q.questionEn}`, bold: true }),
                new TextRun({ text: ` (${q.questionFa})`, color: '6B7280' }),
              ],
              spacing: { before: 100, after: 60 },
            }),
            ...(q.options
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `   Options: ${q.options.join('   |   ')}`,
                      }),
                    ],
                    spacing: { after: 60 },
                  }),
                ]
              : []),
            new Paragraph({
              children: [
                new TextRun({
                  text: '   Your Answer / پاسخ شما: ____________________________________________________',
                  color: '9CA3AF',
                }),
              ],
              spacing: { after: 160 },
            }),
          ]),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `StorySpark_${lesson.titleEn.replace(/\s+/g, '_')}_Worksheet.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export complete database (lessons + vocabulary) as a JSON file
 */
export async function exportAllDataAsJSON(): Promise<void> {
  const lessons = await db.lessons.toArray();
  const vocabulary = await db.vocabulary.toArray();
  const backup = {
    appName: 'StorySpark',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    lessons,
    vocabulary,
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `StorySpark_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import database from JSON file
 */
export async function importDataFromJSON(jsonFile: File): Promise<{ lessonsCount: number; vocabCount: number }> {
  const text = await jsonFile.text();
  const data = JSON.parse(text);

  if (!data.lessons || !Array.isArray(data.lessons)) {
    throw new Error('فایل پشتیبان نامعتبر است (آرایه درس‌ها یافت نشد).');
  }

  await db.transaction('rw', db.lessons, db.vocabulary, async () => {
    for (const lesson of data.lessons) {
      await db.lessons.put(lesson);
    }
    if (data.vocabulary && Array.isArray(data.vocabulary)) {
      for (const vocab of data.vocabulary) {
        await db.vocabulary.put(vocab);
      }
    }
  });

  return {
    lessonsCount: data.lessons.length,
    vocabCount: (data.vocabulary && data.vocabulary.length) || 0,
  };
}
