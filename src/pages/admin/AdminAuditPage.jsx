import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminLayout } from '../../components/AdminLayout';

export const AdminAuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [limitCount, setLimitCount] = useState(100);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, 'audit_logs'),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
        const snap = await getDocs(q);
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [limitCount]);

  const filtered =
    actionFilter === 'all'
      ? logs
      : logs.filter((l) => l.action === actionFilter);
  const actions = ['all', ...new Set(logs.map((l) => l.action).filter(Boolean))];

  const exportCsv = () => {
    const headers = ['timestamp', 'userId', 'userRole', 'action', 'entityType', 'entityId', 'changes'];
    const rows = filtered.map((l) =>
      headers.map((h) => {
        const v = l[h];
        if (h === 'timestamp' && v?.toDate) return v.toDate().toISOString();
        if (typeof v === 'object') return JSON.stringify(v);
        return String(v ?? '');
      })
    );
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Audit Logs</h1>
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="flex gap-2">
          {actions.slice(0, 10).map((a) => (
            <button
              key={a}
              onClick={() => setActionFilter(a)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                actionFilter === a ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <select
          value={limitCount}
          onChange={(e) => setLimitCount(Number(e.target.value))}
          className="input w-24"
        >
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
          <option value={500}>500</option>
        </select>
        <button onClick={exportCsv} className="btn-secondary">
          Export CSV
        </button>
      </div>
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Changes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No audit logs.
                </td>
              </tr>
            ) : (
              filtered.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {l.timestamp?.toDate?.()?.toLocaleString?.() ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{l.userId}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{l.action}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {l.entityType} / {l.entityId}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                    {l.changes ? JSON.stringify(l.changes) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};
