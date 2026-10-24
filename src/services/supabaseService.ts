/**
 * Supabase Cloud Sync & Realtime Service
 * Provides optional PostgreSQL synchronization, authentication, and RLS schema definition.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { db } from '../db/dexie';
import type { SupabaseConfig } from '../types';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(config: SupabaseConfig): SupabaseClient | null {
  if (!config.url || !config.anonKey) return null;
  if (!supabaseInstance || (supabaseInstance as any)?.supabaseUrl !== config.url) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}

export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- StorySpark PostgreSQL Schema & RLS Setup
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create lessons table
create table if not exists public.lessons (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  title_en text not null,
  title_fa text not null,
  age_level text,
  cefr_level text,
  accent text,
  style text,
  length text,
  image_thumbnail text,
  detected_items jsonb,
  observable_actions jsonb,
  background_and_setting jsonb,
  visible_text_on_page text,
  is_legible boolean default true,
  story_en text,
  story_fa text,
  story_paragraphs jsonb,
  vocabulary jsonb,
  phonics_sound jsonb,
  questions jsonb,
  audit jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Create vocabulary flashcards table
create table if not exists public.vocabulary (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  lesson_id text references public.lessons(id) on delete cascade,
  word text not null,
  meaning_fa text not null,
  part_of_speech text,
  ipa text,
  pronunciation_guide_fa text,
  example_en text,
  example_fa text,
  difficulty text,
  category text,
  in_story boolean default true,
  repetitions integer default 0,
  interval_days integer default 0,
  ease_factor numeric default 2.5,
  next_review_date timestamptz default now(),
  mastery_level text default 'new',
  last_reviewed timestamptz,
  created_at timestamptz default now()
);

-- 3. Enable Row-Level Security (RLS)
alter table public.lessons enable row level security;
alter table public.vocabulary enable row level security;

-- 4. RLS Policies: Authenticated users manage their own data
create policy "Users can manage own lessons"
  on public.lessons for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own vocabulary"
  on public.vocabulary for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. Enable Realtime Publications
alter publication supabase_realtime add table public.lessons;
alter publication supabase_realtime add table public.vocabulary;
`;

/**
 * Test connectivity with Supabase project
 */
export async function testSupabaseConnection(config: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  try {
    const client = getSupabaseClient(config);
    if (!client) return { success: false, message: 'آدرس URL یا کلید Anon نامعتبر است.' };

    const { error } = await client.from('lessons').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, it's a schema issue, but connection reached Supabase
      if (error.message.includes('relation "public.lessons" does not exist')) {
        return {
          success: true,
          message: 'اتصال با موفقیت برقرار شد! لطفاً اسکریپت SQL پایین را در پنل Supabase خود اجرا کنید تا جداول ساخته شوند.',
        };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'اتصال به پروژه Supabase با موفقیت تأیید شد.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'خطا در برقراری ارتباط با Supabase.' };
  }
}

/**
 * Perform two-way bidirectional sync between IndexedDB and Supabase
 */
export async function syncWithSupabase(config: SupabaseConfig): Promise<{ uploaded: number; downloaded: number }> {
  const client = getSupabaseClient(config);
  if (!client) throw new Error('سرویس Supabase تنظیم نشده است.');

  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('برای همگام‌سازی، ابتدا باید وارد حساب کاربری Supabase خود شوید.');

  // 1. Fetch local lessons
  const localLessons = await db.lessons.toArray();
  const localVocab = await db.vocabulary.toArray();

  let uploadedCount = 0;
  let downloadedCount = 0;

  // 2. Upload local lessons to Supabase
  for (const l of localLessons) {
    const row = {
      id: l.id,
      user_id: user.id,
      title_en: l.titleEn,
      title_fa: l.titleFa,
      age_level: l.ageLevel,
      cefr_level: l.cefrLevel,
      accent: l.accent,
      style: l.style,
      length: l.length,
      image_thumbnail: l.imageThumbnail,
      detected_items: l.detectedItems,
      observable_actions: l.observableActions,
      background_and_setting: l.backgroundAndSetting,
      visible_text_on_page: l.visibleTextOnPage,
      is_legible: l.isLegible,
      story_en: l.storyEn,
      story_fa: l.storyFa,
      story_paragraphs: l.storyParagraphs,
      vocabulary: l.vocabulary,
      phonics_sound: l.phonicsSound,
      questions: l.questions,
      audit: l.audit,
      updated_at: l.updatedAt || new Date().toISOString(),
    };

    const { error } = await client.from('lessons').upsert(row);
    if (!error) uploadedCount++;
  }

  // 3. Download cloud lessons
  const { data: cloudLessons, error: dlError } = await client.from('lessons').select('*');
  if (!dlError && cloudLessons) {
    for (const r of cloudLessons) {
      const existing = await db.lessons.get(r.id);
      if (!existing) {
        await db.lessons.put({
          id: r.id,
          titleEn: r.title_en,
          titleFa: r.title_fa,
          ageLevel: r.age_level,
          cefrLevel: r.cefr_level,
          accent: r.accent,
          style: r.style,
          length: r.length,
          imageThumbnail: r.image_thumbnail,
          detectedItems: r.detected_items || [],
          observableActions: r.observable_actions || [],
          backgroundAndSetting: r.background_and_setting || { settingEn: '', settingFa: '', visualDetailsFa: '' },
          visibleTextOnPage: r.visible_text_on_page || '',
          isLegible: r.is_legible ?? true,
          storyEn: r.story_en,
          storyFa: r.story_fa,
          storyParagraphs: r.story_paragraphs || [],
          vocabulary: r.vocabulary || [],
          phonicsSound: r.phonics_sound,
          questions: r.questions || [],
          audit: r.audit,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        });

        // Also add vocab to local table
        if (r.vocabulary && Array.isArray(r.vocabulary)) {
          for (const v of r.vocabulary) {
            await db.vocabulary.put(v);
          }
        }
        downloadedCount++;
      }
    }
  }

  return { uploaded: uploadedCount, downloaded: downloadedCount };
}
