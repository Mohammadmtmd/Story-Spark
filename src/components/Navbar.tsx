import React from 'react';
import {
  Sparkles,
  BookOpen,
  PlusCircle,
  Archive,
  Layers,
  Award,
  Settings,
  Cloud,
  Download,
  HelpCircle,
  Sun,
  Moon,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'create'
  | 'archive'
  | 'leitner'
  | 'quiz'
  | 'settings'
  | 'supabase'
  | 'backup'
  | 'help';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  dueCount: number;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  dueCount,
  theme,
  toggleTheme,
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'داشبورد', icon: BookOpen },
    { id: 'create' as ActiveTab, label: 'ساخت درس جدید', icon: PlusCircle, highlight: true },
    { id: 'archive' as ActiveTab, label: 'آرشیو درس‌ها', icon: Archive },
    { id: 'leitner' as ActiveTab, label: 'جعبه لایتنر', icon: Layers, badge: dueCount },
    { id: 'quiz' as ActiveTab, label: 'آزمون تعاملی', icon: Award },
    { id: 'settings' as ActiveTab, label: 'تنظیمات هوش مصنوعی', icon: Settings },
    { id: 'supabase' as ActiveTab, label: 'همگام‌سازی ابری', icon: Cloud },
    { id: 'backup' as ActiveTab, label: 'پشتیبان و خروجی', icon: Download },
    { id: 'help' as ActiveTab, label: 'راهنمای آموزشی', icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-amber-200/50 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Mark Zone */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-lg font-bold font-en tracking-tight text-stone-900 dark:text-stone-100">
                StorySpark
              </span>
              <span className="hidden sm:inline-block mr-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                استودیو هوشمند زبان
              </span>
            </div>
          </div>

          {/* Desktop Nav Links Zone */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 shadow-xs'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                  } ${item.highlight && !isActive ? 'ring-1 ring-amber-400/50 text-amber-700 dark:text-amber-300' : ''}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600 dark:text-amber-400' : ''}`} />
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white animate-bounce">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Actions Zone: Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Horizontal Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 bg-stone-50 dark:bg-stone-900/50 border-t border-stone-200/50 dark:border-stone-800/50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="px-1 text-[9px] font-bold rounded-full bg-red-500 text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
