import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LanguageProvider } from './context/LanguageContext.js';
import { Navbar } from './components/Navbar.js';
import { BottomNav } from './components/BottomNav.js';
import { DesktopSidebar } from './components/DesktopSidebar.js';
import { Home } from './pages/Home.js';
import { TasksPage } from './pages/TasksPage.js';
import { SpinPage } from './pages/SpinPage.js';
import { WatchAdsPage } from './pages/WatchAdsPage.js';
import { WalletPage } from './pages/WalletPage.js';
import { ReferralPage } from './pages/ReferralPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { SupportPage } from './pages/SupportPage.js';
import { AuthModal } from './pages/AuthPages.js';
import { AdminLayout } from './pages/admin/AdminLayout.js';

function AppContent() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
      return 'admin';
    }
    return 'home';
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  // Sync URL hash or back button
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/admin') {
        setCurrentTab('admin');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // When admin tab is active, show the dedicated full-screen Administrator panel
  if (currentTab === 'admin') {
    return <AdminLayout onBackToApp={() => setCurrentTab('home')} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={() => openAuth('login')}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Desktop Left Sidebar */}
        <DesktopSidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {currentTab === 'home' && (
            <Home setCurrentTab={setCurrentTab} onOpenAuth={() => openAuth('register')} />
          )}
          {currentTab === 'tasks' && <TasksPage onOpenAuth={() => openAuth('login')} />}
          {currentTab === 'spin' && <SpinPage onOpenAuth={() => openAuth('login')} />}
          {currentTab === 'ads' && <WatchAdsPage onOpenAuth={() => openAuth('login')} />}
          {currentTab === 'wallet' && <WalletPage onOpenAuth={() => openAuth('login')} />}
          {currentTab === 'referral' && <ReferralPage onOpenAuth={() => openAuth('login')} />}
          {currentTab === 'profile' && <ProfilePage onOpenAuth={() => openAuth('login')} />}
          {currentTab === 'support' && <SupportPage />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
