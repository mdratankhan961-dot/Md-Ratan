import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { AdminAuditLog } from '../../types/index.js';
import { Shield, Clock, FileText, Search, User } from 'lucide-react';

export const AdminAudit: React.FC = () => {
  const { adminToken } = useAuth();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!adminToken) return;
    setLoading(true);
    fetch('/api/admin/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((r) => r.json())
      .then((d) => setLogs(d.auditLogs || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [adminToken]);

  const filteredLogs = logs.filter(
    (l) =>
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.adminUsername.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-400" />
            <span>Administrative Audit Log</span>
          </h1>
          <p className="text-xs text-slate-400">
            Immutable, server-recorded administrative actions for governance & security oversight.
          </p>
        </div>

        <input
          type="text"
          placeholder="Filter audit logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-xl border border-slate-800 bg-slate-900 py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
        />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Admin</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 shrink-0">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-purple-400 font-mono">
                      @{log.adminUsername}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-medium">
                      {log.targetType} {log.targetId ? `(${log.targetId})` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
