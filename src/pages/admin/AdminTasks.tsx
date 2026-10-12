import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { Task, TaskCategory } from '../../types/index.js';
import {
  CheckSquare,
  Plus,
  Trash2,
  Edit,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Pause,
} from 'lucide-react';

export const AdminTasks: React.FC = () => {
  const { adminToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [titleBn, setTitleBn] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionBn, setDescriptionBn] = useState('');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState<TaskCategory>('website_visit');
  const [reward, setReward] = useState('15');
  const [durationSeconds, setDurationSeconds] = useState('45');
  const [gateSeconds, setGateSeconds] = useState('10');
  const [dailyLimit, setDailyLimit] = useState('1');
  const [totalLimit, setTotalLimit] = useState('1000');
  const [externalUrl, setExternalUrl] = useState('');
  const [requiresProof, setRequiresProof] = useState(false);
  const [proofPlaceholder, setProofPlaceholder] = useState('');

  const fetchTasks = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tasks', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [adminToken]);

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setTitleBn('');
    setDescription('');
    setDescriptionBn('');
    setInstructions('1. View the sponsor gateway\n2. Browse page for duration\n3. Return to claim reward');
    setCategory('website_visit');
    setReward('15');
    setDurationSeconds('45');
    setGateSeconds('10');
    setDailyLimit('1');
    setTotalLimit('1000');
    setExternalUrl('https://bangladesh.gov.bd');
    setRequiresProof(false);
    setProofPlaceholder('');
    setShowModal(true);
  };

  const openEditModal = (t: Task) => {
    setEditingTask(t);
    setTitle(t.title);
    setTitleBn(t.titleBn || '');
    setDescription(t.description);
    setDescriptionBn(t.descriptionBn || '');
    setInstructions(t.instructions.join('\n'));
    setCategory(t.category);
    setReward(t.reward.toString());
    setDurationSeconds(t.durationSeconds.toString());
    setGateSeconds(t.gateSeconds.toString());
    setDailyLimit(t.dailyLimit.toString());
    setTotalLimit(t.totalLimit.toString());
    setExternalUrl(t.externalUrl || '');
    setRequiresProof(Boolean(t.requiresProof));
    setProofPlaceholder(t.proofPlaceholder || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      titleBn,
      description,
      descriptionBn,
      instructions: instructions.split('\n').filter((i) => i.trim().length > 0),
      category,
      reward: parseFloat(reward),
      durationSeconds: parseInt(durationSeconds, 10),
      gateSeconds: parseInt(gateSeconds, 10),
      dailyLimit: parseInt(dailyLimit, 10),
      totalLimit: parseInt(totalLimit, 10),
      externalUrl,
      requiresProof,
      proofPlaceholder,
    };

    try {
      const url = editingTask ? `/api/admin/tasks/${editingTask.id}` : '/api/admin/tasks';
      const method = editingTask ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchTasks();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save task');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/admin/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/admin/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-purple-400" />
            <span>Task Management & Timer Gates</span>
          </h1>
          <p className="text-xs text-slate-400">
            Configure sponsor requirements, rewards in BDT, and mandatory 10-second security countdowns.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Task</span>
        </button>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/20">
                  {task.category.toUpperCase()}
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{task.title}</h3>
                {task.titleBn && (
                  <p className="text-xs text-slate-400">{task.titleBn}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-emerald-400">৳ {task.reward}</span>
                <p className="text-[10px] text-slate-400">{task.durationSeconds}s duration</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 line-clamp-2">{task.description}</p>

            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-950 p-2.5 text-[11px] border border-slate-800 text-slate-400">
              <div>
                <span>Ad Gate:</span>
                <p className="font-bold text-amber-400">{task.gateSeconds}s mandatory</p>
              </div>
              <div>
                <span>Daily Limit:</span>
                <p className="font-bold text-white">{task.dailyLimit} per user</p>
              </div>
              <div>
                <span>Completions:</span>
                <p className="font-bold text-emerald-400">{task.completedCount} / {task.totalLimit}</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
              <button
                onClick={() => handleToggleStatus(task)}
                className={`flex items-center gap-1 font-bold text-[11px] rounded-lg px-2.5 py-1 ${
                  task.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {task.status === 'active' ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                <span>{task.status.toUpperCase()}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(task)}
                  className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="rounded-lg bg-rose-500/20 p-2 text-rose-400 hover:bg-rose-500/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-white">
              {editingTask ? 'Edit Task' : 'Create New Sponsor Task'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Title (English)</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Title (বাংলা)</label>
                  <input
                    type="text"
                    value={titleBn}
                    onChange={(e) => setTitleBn(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Instructions (One step per line)
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:border-purple-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Reward (৳)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white font-bold text-emerald-400 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration (Sec)</label>
                  <input
                    type="number"
                    required
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Gate (Sec)</label>
                  <input
                    type="number"
                    required
                    value={gateSeconds}
                    onChange={(e) => setGateSeconds(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white text-amber-400 font-bold focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Daily Limit</label>
                  <input
                    type="number"
                    required
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">External Target URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-purple-600 py-3 text-xs font-bold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"
              >
                {editingTask ? 'Save Changes' : 'Publish Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
