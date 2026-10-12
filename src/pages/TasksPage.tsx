import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { Task } from '../types/index.js';
import { TaskDetailModal } from './TaskDetailPage.js';
import {
  CheckSquare,
  Clock,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface TasksPageProps {
  onOpenAuth: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({ onOpenAuth }) => {
  const { user, userToken, refreshUser } = useAuth();
  const { language, t } = useLanguage();

  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    if (!userToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [userToken]);

  const categories = [
    { id: 'all', label: language === 'bn' ? 'সবগুলো' : 'All Tasks' },
    { id: 'website_visit', label: language === 'bn' ? 'ওয়েবসাইট ভিজিট' : 'Web Visit' },
    { id: 'quiz', label: language === 'bn' ? 'কুইজ' : 'Quiz' },
    { id: 'video_watch', label: language === 'bn' ? 'ভিডিও ওয়াচ' : 'Video' },
    { id: 'social_follow', label: language === 'bn' ? 'সোশ্যাল ফলো' : 'Social' },
    { id: 'survey', label: language === 'bn' ? 'সার্ভে' : 'Survey' },
  ];

  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.titleBn && task.titleBn.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-emerald-400" />
            <span>{t.tasks}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {language === 'bn'
              ? '১০ সেকেন্ডের স্পনসরড সিকিউরিটি গেট পার করে টাস্ক সম্পন্ন করুন।'
              : 'Complete high-paying sponsor tasks with 10s ad security gates.'}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder={language === 'bn' ? 'টাস্ক খুঁজুন...' : 'Search tasks...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedCategory === cat.id
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {!user ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center space-y-3">
          <Shield className="mx-auto h-12 w-12 text-emerald-400" />
          <h3 className="text-base font-bold text-white">
            {language === 'bn' ? 'টাস্ক করতে অনুগ্রহ করে লগইন করুন' : 'Please Sign In to Access Tasks'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {language === 'bn'
              ? 'টাস্কের টাকা সরাসরি আপনার ওয়ালেটে জমা হতে ফ্রি একাউন্ট তৈরি করুন।'
              : 'Create an account to earn and deposit rewards directly into your BDT wallet.'}
          </p>
          <button
            onClick={onOpenAuth}
            className="rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
          >
            {t.login} / {t.register}
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400 text-sm">
          {t.noTasks}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => {
                if (task.isAvailable) setSelectedTask(task);
              }}
              className={`rounded-2xl border p-5 transition-all shadow-md ${
                task.isAvailable
                  ? 'border-slate-800 bg-slate-900 hover:border-emerald-500/50 cursor-pointer group'
                  : 'border-slate-800/40 bg-slate-950/60 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                    {task.category.toUpperCase().replace('_', ' ')}
                  </span>
                  <h3 className="mt-2 text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {language === 'bn' && task.titleBn ? task.titleBn : task.title}
                  </h3>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-base sm:text-lg font-black text-emerald-400">
                    ৳ {task.reward}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {task.durationSeconds} {t.seconds}
                  </p>
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                {language === 'bn' && task.descriptionBn ? task.descriptionBn : task.description}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {language === 'bn' ? `দৈনিক লিমিট: ${task.dailyLimit}` : `Daily limit: ${task.dailyLimit}`}
                  </span>
                </div>

                {task.isCompletedToday ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{language === 'bn' ? 'আজকের জন্য সম্পন্ন' : 'Completed Today'}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                    <span>{t.startTask}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSuccess={() => {
            fetchTasks();
            refreshUser();
          }}
        />
      )}
    </div>
  );
};
