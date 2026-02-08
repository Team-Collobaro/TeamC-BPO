import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { updateUserStatusLocal } from '../../lib/dbUpdates';
import { AdminLayout } from '../../components/AdminLayout';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        setError('Failed to load users. Ensure Firestore rules allow admin read.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateStatus = async (userId, status) => {
    setError(null);
    setUpdating(userId);
    try {
      await updateUserStatusLocal(db, userId, status);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status } : u))
      );
    } catch (err) {
      setError(err.message || 'Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  const filtered =
    roleFilter === 'all'
      ? users
      : users.filter((u) => u.role === roleFilter);

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
      <h1 className="text-2xl font-bold text-gray-900 mb-4">User Management</h1>
      <div className="flex gap-2 mb-6">
        {['all', 'learner', 'candidate', 'employer', 'admin'].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              roleFilter === r ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm mb-4">
          {error}
        </div>
      )}
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.role || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        u.status === 'suspended' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {u.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {u.createdAt?.toDate?.()?.toLocaleDateString?.() ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.status === 'suspended' ? (
                      <button
                        onClick={() => updateStatus(u.id, 'active')}
                        disabled={updating === u.id}
                        className="text-sm text-green-600 hover:underline"
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(u.id, 'suspended')}
                        disabled={updating === u.id}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Suspend
                      </button>
                    )}
                    {updating === u.id && <span className="text-sm text-gray-500 ml-2">Updating...</span>}
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
