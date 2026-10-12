import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { AdminLogin } from './AdminLogin.js';
import { AdminDashboard } from './AdminDashboard.js';
import { AdminUsers } from './AdminUsers.js';
import { AdminTasks } from './AdminTasks.js';
import { AdminWithdrawals } from './AdminWithdrawals.js';
import { AdminAds } from './AdminAds.js';
import { AdminSpin } from './AdminSpin.js';
import { AdminSettings } from './AdminSettings.js';
import { AdminAudit } from './AdminAudit.js';
import {
  Shield,
  LayoutDashboard,
  Users,
  CheckSquare,
  Wallet,
  Globe,
  Disc3,
  Sliders,
  FileText,
  LogOut,
  ArrowLeft,
} from 'lucide-react';

interface AdminLayoutProps {
  onBackToApp: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onBackToApp }) => {
  const { admin, logoutAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (!admin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-10 px-4">
        <div className="max-w-md mx-auto w-full mb-4">
          <button
            onClick={onBackToApp}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to User Platform</span>
          </button>
        </div>
        <AdminLogin onSuccess={() => setActiveTab('dashboard')} />
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users & Balances', icon: Users },
    { id: 'tasks', label: 'Tasks & Timers', icon: CheckSquare },
    { id: 'withdrawals', label: 'Withdrawals (bKash/Nagad)', icon: Wallet },
    { id: 'ads', label: 'Adsterra & Monetag', icon: Globe },
    { id: 'spin', label: 'Lucky Spin', icon: Disc3 },
    { id: 'settings', label: 'Reward Settings', icon: Sliders },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 border-b border-purple-500/20 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/30">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-white">
              TakaEarn BD <span className="text-purple-400 font-mono text-xs">Admin Control</span>
            </h1>
            <p className="text-[10px] text-slate-400">Authenticated Administrator: @{admin.username}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToApp}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Go to User App</span>
          </button>

          <button
            onClick={logoutAdmin}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/20 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-900/30"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Admin Nav Bar */}
      <div className="border-b border-slate-800 bg-slate-900/70 px-4 sm:px-6 overflow-x-auto scrollbar-none">
        <div className="flex gap-1 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && <AdminDashboard onNavigate={(t) => setActiveTab(t)} />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'tasks' && <AdminTasks />}
        {activeTab === 'withdrawals' && <AdminWithdrawals />}
        {activeTab === 'ads' && <AdminAds />}
        {activeTab === 'spin' && <AdminSpin />}
        {activeTab === 'settings' && <AdminSettings />}
        {activeTab === 'audit' && <AdminAudit />}
      </main>
    </div>
  );
};
