import React from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { Home, CheckSquare, Disc3, Wallet, User, PlayCircle } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const { t } = useLanguage();

  const navItems = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'tasks', label: t.tasks, icon: CheckSquare },
    { id: 'spin', label: t.spin, icon: Disc3, highlight: true },
    { id: 'ads', label: t.watchAds, icon: PlayCircle },
    { id: 'wallet', label: t.wallet, icon: Wallet },
    { id: 'profile', label: t.profile, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-lg pb-safe">
      <div className="grid grid-cols-6 h-16 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 transition-all ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`relative flex items-center justify-center rounded-xl p-1.5 transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/20 scale-110'
                    : item.highlight
                    ? 'text-amber-400'
                    : ''
                }`}
              >
                <Icon className={`h-5 w-5 ${item.highlight && !isActive ? 'animate-bounce' : ''}`} />
                {item.highlight && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[54px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
