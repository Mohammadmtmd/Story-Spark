import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Settings,
  Sparkles,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  QrCode,
  Smartphone,
  Globe,
  Radio,
  RefreshCw,
  Zap,
} from 'lucide-react';
import type { AISettings, EnglishAccent } from '../types';
import {
  AI_PRESETS,
  detectKeyMismatch,
  testAIConnection,
} from '../services/aiService';
import { encryptApiKey, decryptApiKey } from '../services/crypto';
import { db } from '../db/dexie';

interface SettingsViewProps {
  settings: AISettings;
  onSaveSettings: (settings: AISettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<AISettings>({ ...settings });
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Mobile pairing modal
  const [showPairModal, setShowPairModal] = useState<boolean>(false);
  const [pairPin, setPairPin] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Key format mismatch detection
  const mismatch = detectKeyMismatch(formData.apiKey, formData.provider);

  const handleApplyPreset = (presetId: string) => {
    const found = AI_PRESETS.find((p) => p.id === presetId);
    if (!found) return;

    setFormData((prev) => ({
      ...prev,
      provider: found.provider,
      model: found.model,
      customBaseUrl: found.baseUrl || '',
    }));
  };

  const handleMismatchSwitch = () => {
    if (mismatch === 'suggest_gemini') {
      setFormData((prev) => ({
        ...prev,
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        customBaseUrl: '',
      }));
    } else if (mismatch === 'suggest_openai') {
      setFormData((prev) => ({
        ...prev,
        provider: 'openai',
        model: 'gpt-4o-mini',
        customBaseUrl: 'https://api.openai.com/v1',
      }));
    }
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testAIConnection(formData);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'خطا در برقراری ارتباط آزمایشی.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    // Save to indexedDB
    await db.settings.put({ id: 'ai_settings', data: formData });
    onSaveSettings(formData);
    setTestResult({ success: true, message: 'تنظیمات با موفقیت در دستگاه ذخیره شد.' });
  };

  // Generate pairing QR code and 6-digit PIN
  const handleOpenMobilePair = async () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setPairPin(pin);

    // Payload for mobile: contains provider, model, and key
    const payload = JSON.stringify({
      pin,
      p: formData.provider,
      m: formData.model,
      k: formData.apiKey,
      u: formData.customBaseUrl,
    });

    try {
      const url = await QRCode.toDataURL(payload, {
        width: 240,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
      setShowPairModal(true);
    } catch (e) {
      console.error('QR generation error:', e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-500" />
          <span>تنظیمات ارتباطی هوش مصنوعی و امنیت</span>
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          پشتیبانی از اتصال مستقیم مرورگر (Direct Browser)، مدل‌های بینایی گوگل جمینای، OpenAI، Groq، DeepSeek، و Ollama محلی
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-6">
        
        {/* Section 1: Execution Mode (Direct vs Server Proxy) */}
        <div className="space-y-3 pb-6 border-b border-stone-100 dark:border-stone-800">
          <label className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-500" />
            <span>نحوه اتصال و تبادل داده با هوش مصنوعی</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, directBrowserMode: true }))}
              className={`p-4 rounded-2xl text-right transition-all border ${
                formData.directBrowserMode
                  ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500/50 shadow-xs ring-1 ring-amber-400'
                  : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200/60 dark:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                  اتصال مستقیم از مرورگر (Direct Browser)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  پیشنهادی
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                ارسال مستقیم از مرورگر کاربر به گوگل/OpenAI بدون عبور از پراکسی واسط، حذف خطای ۴۰۵ و حفظ امنیت کامل کلیدها.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, directBrowserMode: false }))}
              className={`p-4 rounded-2xl text-right transition-all border ${
                !formData.directBrowserMode
                  ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500/50 shadow-xs ring-1 ring-amber-400'
                  : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200/60 dark:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                  پراکسی سرور واسط (Server Proxy Fallback)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                  پشتیبان
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                ارسال درخواست از طریق سرور Express با محدودیت حجم ۲۵ مگابایت و محافظت در برابر SSRF.
              </p>
            </button>
          </div>
        </div>

        {/* Section 2: 1-Click Presets */}
        <div className="space-y-3 pb-6 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>تنظیمات آماده سرویس‌دهندگان (Presets)</span>
            </label>
            <span className="text-[11px] text-stone-400">تغییر با یک کلیک</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {AI_PRESETS.map((preset) => {
              const isSelected =
                formData.provider === preset.provider && formData.model === preset.model;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id)}
                  className={`p-3 rounded-2xl text-right text-xs transition-all border ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-400'
                      : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200/60 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-300'
                  }`}
                >
                  <div className="font-bold font-en text-[12px] truncate">{preset.name}</div>
                  <div className="text-[10px] text-stone-400 truncate mt-0.5">{preset.model}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Key Mismatch Alert Banner */}
        {mismatch && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                {mismatch === 'suggest_gemini'
                  ? 'کلید وارد شده با فرمت AIzaSy مربوط به Google Gemini است، اما سرویس دیگری انتخاب شده است.'
                  : 'کلید وارد شده با فرمت sk- مربوط به OpenAI است، اما سرویس گوگل جمینای انتخاب شده است.'}
              </span>
            </div>
            <button
              onClick={handleMismatchSwitch}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap shadow-xs"
            >
              {mismatch === 'suggest_gemini' ? 'تغییر به Gemini با ۱ کلیک' : 'تغییر به OpenAI با ۱ کلیک'}
            </button>
          </div>
        )}

        {/* Section 3: API Key & Configuration Inputs */}
        <div className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>کلید اختصاصی API (API Key)</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={(e) => setFormData((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder="مثال: AIzaSy... یا sk-..."
                className="w-full pl-10 pr-4 py-2.5 text-xs font-mono rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute left-3 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-[11px] text-stone-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>کلید با رمزنگاری سخت‌افزاری AES-GCM 256-bit در حافظه دستگاه شما نگهداری می‌شود.</span>
            </div>
          </div>

          {/* Model Name & Base URL (if custom) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                نام دقیق مدل (Model ID)
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
              />
            </div>

            {formData.provider !== 'gemini' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  آدرس پایه سرور (Base URL)
                </label>
                <input
                  type="text"
                  value={formData.customBaseUrl || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, customBaseUrl: e.target.value }))}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>
            )}
          </div>

        </div>

        {/* Diagnostic Connection Test Feedback */}
        {testResult && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900'
                : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-900'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Buttons Action Bar */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunTest}
              disabled={isTesting}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>تست اتصال هوش مصنوعی</span>
            </button>

            <button
              onClick={handleOpenMobilePair}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-xs font-bold text-amber-700 dark:text-amber-300 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>اتصال به گوشی با QR Code</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105"
          >
            ذخیره تنظیمات
          </button>
        </div>

      </div>

      {/* Mobile Pairing Modal */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-2xl text-center space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-500" />
                <span>اتصال سریع تلفن همراه به استودیو</span>
              </h3>
              <button
                onClick={() => setShowPairModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              با دوربین گوشی خود کد QR زیر را اسکن کنید تا تنظیمات و کلید بدون نیاز به تایپ دستی منتقل شوند:
            </p>

            {qrDataUrl && (
              <div className="p-4 bg-white rounded-2xl inline-block shadow-md">
                <img src={qrDataUrl} alt="Pairing QR Code" className="w-48 h-48 mx-auto" />
              </div>
            )}

            <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-xs space-y-1">
              <div className="text-stone-500">کد تأیید ۶ رقمی:</div>
              <div className="text-2xl font-mono font-bold tracking-widest text-amber-600 dark:text-amber-400">
                {pairPin}
              </div>
            </div>

            <button
              onClick={() => setShowPairModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
