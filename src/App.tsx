/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { Lesson, VocabularyItem, AISettings, SupabaseConfig } from './types';
import { db, loadSampleLessonIntoDB } from './db/dexie';
import { Navbar, type ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CreateLessonView } from './components/CreateLessonView';
import { ArchiveView } from './components/ArchiveView';
import { VocabularyLeitnerView } from './components/VocabularyLeitnerView';
import { QuizArenaView } from './components/QuizArenaView';
import { SettingsView } from './components/SettingsView';
import { SupabaseSyncView } from './components/SupabaseSyncView';
import { BackupExportView } from './components/BackupExportView';
import { HelpGuideView } from './components/HelpGuideView';
import { LessonDetailModal } from './components/LessonDetailModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // AI Settings
  const [aiSettings, setAiSettings] = useState<AISettings>({
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    apiKey: '',
    directBrowserMode: true,
    preferredAccent: 'en-US',
    speechRate: 0.95,
    theme: 'light',
  });

  // Supabase Config
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
    isConnected: false,
  });

  // Fetch all data from Dexie IndexedDB
  const refreshData = useCallback(async () => {
    try {
      const allLessons = await db.lessons.toArray();
      // Sort newest first
      allLessons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLessons(allLessons);

      const allVocab = await db.vocabulary.toArray();
      setVocabulary(allVocab);

      // Load settings
      const savedSettings = await db.settings.get('ai_settings');
      if (savedSettings && savedSettings.data) {
        setAiSettings(savedSettings.data as AISettings);
      }

      const savedSupa = await db.settings.get('supabase_config');
      if (savedSupa && savedSupa.data) {
        setSupabaseConfig(savedSupa.data as SupabaseConfig);
      }
    } catch (e) {
      console.error('Error loading data from Dexie:', e);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    refreshData();

    // Check system or stored theme
    const savedTheme = localStorage.getItem('storyspark_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [refreshData]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('storyspark_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Due cards count for navbar badge
  const now = new Date();
  const dueCount = vocabulary.filter(
    (v) => !v.nextReviewDate || new Date(v.nextReviewDate) <= now
  ).length;

  const handleLessonCreated = (newLesson: Lesson) => {
    setLessons((prev) => [newLesson, ...prev]);
    setVocabulary((prev) => [...newLesson.vocabulary, ...prev]);
    setSelectedLesson(newLesson);
  };

  const handleDeleteLesson = async (id: string) => {
    await db.lessons.delete(id);
    await db.vocabulary.where('lessonId').equals(id).delete();
    setLessons((prev) => prev.filter((l) => l.id !== id));
    setVocabulary((prev) => prev.filter((v) => v.lessonId !== id));
    if (selectedLesson?.id === id) {
      setSelectedLesson(null);
    }
  };

  const handleUpdateVocab = (updated: VocabularyItem) => {
    setVocabulary((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  };

  const handleStartQuiz = (lesson: Lesson) => {
    setQuizLesson(lesson);
    setSelectedLesson(null);
    setActiveTab('quiz');
  };

  const handleLoadSample = async () => {
    await loadSampleLessonIntoDB();
    await refreshData();
  };

  return (
    <div className="min-h-screen bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dueCount={dueCount}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            lessons={lessons}
            vocabulary={vocabulary}
            onSelectLesson={(lesson) => setSelectedLesson(lesson)}
            setActiveTab={setActiveTab}
            onLoadSample={handleLoadSample}
          />
        )}

        {activeTab === 'create' && (
          <CreateLessonView
            settings={aiSettings}
            onLessonCreated={handleLessonCreated}
            onOpenSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'archive' && (
          <ArchiveView
            lessons={lessons}
            onSelectLesson={(lesson) => setSelectedLesson(lesson)}
            onStartQuiz={handleStartQuiz}
            onDeleteLesson={handleDeleteLesson}
            onCreateNew={() => setActiveTab('create')}
          />
        )}

        {activeTab === 'leitner' && (
          <VocabularyLeitnerView
            vocabulary={vocabulary}
            onUpdateVocab={handleUpdateVocab}
            preferredAccent={aiSettings.preferredAccent}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizArenaView
            lessons={lessons}
            selectedLesson={quizLesson}
            onSelectLesson={setQuizLesson}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={aiSettings}
            onSaveSettings={(newSettings) => setAiSettings(newSettings)}
          />
        )}

        {activeTab === 'supabase' && (
          <SupabaseSyncView
            config={supabaseConfig}
            onUpdateConfig={(newConfig) => setSupabaseConfig(newConfig)}
            onSyncComplete={refreshData}
          />
        )}

        {activeTab === 'backup' && (
          <BackupExportView
            onRefreshData={refreshData}
          />
        )}

        {activeTab === 'help' && <HelpGuideView />}
      </main>

      {/* Lesson Detail Modal */}
      {selectedLesson && (
        <LessonDetailModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
          onStartQuiz={handleStartQuiz}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200/60 dark:border-stone-800 py-6 text-center text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold font-en text-stone-700 dark:text-stone-300">StorySpark Studio</span>
            <span>·</span>
            <span>استودیو هوشمند آموزش زبان انگلیسی کودکان بر پایه تحلیل تصاویر کتاب</span>
          </div>
          <div className="text-[11px] text-stone-400">
            توسعه‌یافته به صورت کاملاً آفلاین-فرست (IndexedDB) با هوش مصنوعی بینایی
          </div>
        </div>
      </footer>

    </div>
  );
}
