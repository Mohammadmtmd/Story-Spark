import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  LogIn,
  UserPlus,
  LogOut,
  Database,
  ShieldCheck,
} from 'lucide-react';
import type { SupabaseConfig } from '../types';
import {
  getSupabaseClient,
  SUPABASE_SQL_SCHEMA,
  testSupabaseConnection,
  syncWithSupabase,
} from '../services/supabaseService';
import { db } from '../db/dexie';

interface SupabaseSyncViewProps {
  config: SupabaseConfig;
  onUpdateConfig: (config: SupabaseConfig) => void;
  onSyncComplete: () => void;
}

export const SupabaseSyncView: React.FC<SupabaseSyncViewProps> = ({
  config,
  onUpdateConfig,
  onSyncComplete,
}) => {
  const [formData, setFormData] = useState<SupabaseConfig>({ ...config });
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Auth fields
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Copy state
  const [copied, setCopied] = useState<boolean>(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(formData);
      setTestResult(res);
      if (res.success) {
        onUpdateConfig({ ...formData, isConnected: true });
        await db.settings.put({ id: 'supabase_config', data: { ...formData, isConnected: true } });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = getSupabaseClient(formData);
    if (!client) {
      setAuthFeedback('ابتدا آدرس URL و Anon Key معتبر را وارد کنید.');
      return;
    }

    setAuthLoading(true);
    setAuthFeedback(null);

    try {
      if (authMode === 'signin') {
        const { data, error } = await client.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        setAuthFeedback(`با موفقیت وارد شدید (${data.user?.email})`);
        const updated = { ...formData, userEmail: data.user?.email, isConnected: true };
        setFormData(updated);
        onUpdateConfig(updated);
        await db.settings.put({ id: 'supabase_config', data: updated });
      } else {
        const { data, error } = await client.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        setAuthFeedback('ثبت‌نام انجام شد! لطفاً ایمیل تأییدیه خود را بررسی کنید.');
      }
    } catch (err: any) {
      setAuthFeedback(err.message || 'خطا در عملیات ورود/ثبت‌نام.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    const client = getSupabaseClient(formData);
    if (client) {
      await client.auth.signOut();
    }
    const updated = { ...formData, userEmail: undefined };
    setFormData(updated);
    onUpdateConfig(updated);
    await db.settings.put({ id: 'supabase_config', data: updated });
    setAuthFeedback('با موفقیت خارج شدید.');
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const { uploaded, downloaded } = await syncWithSupabase(formData);
      setSyncFeedback(`همگام‌سازی دوطرفه با موفقیت انجام شد: ${uploaded} درس بارگذاری، ${downloaded} درس دانلود شد.`);
      const updated = { ...formData, lastSyncAt: new Date().toISOString() };
      setFormData(updated);
      onUpdateConfig(updated);
      await db.settings.put({ id: 'supabase_config', data: updated });
      onSyncComplete();
    } catch (err: any) {
      setSyncFeedback(`خطا در همگام‌سازی: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Cloud className="w-6 h-6 text-indigo-500" />
          <span>همگام‌سازی ابری و پایگاه داده PostgreSQL با Supabase</span>
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          پشتیبان‌گیری ابری خودکار، همگام‌سازی بین گوشی و رایانه، امنیت سطح سطر (RLS) و به‌روزرسانی آنی (Realtime)
        </p>
      </div>

      {/* Credentials Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5">
        
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-500" />
          <span>مشخصات اتصال به پروژه Supabase شما</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Project URL
            </label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-en"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Anon Key
            </label>
            <input
              type="password"
              value={formData.anonKey}
              onChange={(e) => setFormData((prev) => ({ ...prev, anonKey: e.target.value }))}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-en"
            />
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900'
                : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-900'
            }`}
          >
            {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || !formData.url || !formData.anonKey}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>تست اتصال به Supabase</span>
          </button>
        </div>

      </div>

      {/* User Auth Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5">
        
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>حساب کاربری ابری (Supabase Auth)</span>
          </h2>
          {formData.userEmail && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold font-en">
              {formData.userEmail}
            </span>
          )}
        </div>

        {formData.userEmail ? (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
            <div className="text-xs text-emerald-900 dark:text-emerald-200">
              وارد حساب کاربری شده‌اید. اطلاعات با RLS به صورت کاملاً امن فقط برای شما همگام می‌شود.
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4 max-w-md">
            <div className="flex items-center gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs w-fit">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`px-3 py-1.5 rounded-lg font-bold ${authMode === 'signin' ? 'bg-white dark:bg-stone-900 shadow-xs' : 'text-stone-500'}`}
              >
                ورود به حساب
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`px-3 py-1.5 rounded-lg font-bold ${authMode === 'signup' ? 'bg-white dark:bg-stone-900 shadow-xs' : 'text-stone-500'}`}
              >
                ثبت‌نام جدید
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="ایمیل شما (example@gmail.com)"
                className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-en"
              />
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="کلمه عبور"
                className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-en"
              />
            </div>

            {authFeedback && (
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {authFeedback}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
            >
              {authLoading ? 'در حال ارسال...' : authMode === 'signin' ? 'ورود به حساب' : 'ایجاد حساب کاربری'}
            </button>
          </form>
        )}

        {/* Sync Now Action */}
        <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-stone-800 dark:text-stone-200">
              همگام‌سازی دوطرفه داده‌ها (IndexedDB ⟷ Supabase)
            </div>
            <div className="text-[11px] text-stone-400">
              {formData.lastSyncAt ? `آخرین همگام‌سازی: ${new Date(formData.lastSyncAt).toLocaleString('fa-IR')}` : 'هنوز همگام نشده'}
            </div>
          </div>

          <button
            onClick={handleSyncNow}
            disabled={isSyncing || !formData.userEmail}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'در حال همگام‌سازی...' : 'همگام‌سازی اکنون'}</span>
          </button>
        </div>

        {syncFeedback && (
          <div className="text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 p-3 rounded-xl">
            {syncFeedback}
          </div>
        )}

      </div>

      {/* SQL Schema Copy Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              کد SQL ساخت جداول و قوانین RLS در Supabase
            </h3>
            <p className="text-xs text-stone-400">
              این اسکریپت را کپی کرده و در بخش SQL Editor داشبورد Supabase خود اجرا کنید.
            </p>
          </div>

          <button
            onClick={handleCopySchema}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'کپی شد!' : 'کپی اسکریپت SQL'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-2xl bg-stone-950 text-stone-300 text-[11px] font-mono overflow-x-auto max-h-56 scrollbar-none direction-ltr text-left">
          {SUPABASE_SQL_SCHEMA}
        </pre>

      </div>

    </div>
  );
};
