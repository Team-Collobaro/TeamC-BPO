import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminLayout } from '../../components/AdminLayout';

export const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, 'payments'),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered =
    typeFilter === 'all'
      ? payments
      : payments.filter((p) => p.type === typeFilter);

  const types = ['all', 'course_purchase', 'joining_fee', 'retake_fee', 'cv_unlock', 'reactivation', 'subscription'];

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
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Payments & Refunds</h1>
      <div className="flex gap-2 mb-6">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              typeFilter === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No payments found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{p.userId?.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    £{((p.amount || 0) / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        p.status === 'succeeded' ? 'bg-green-100 text-green-800' : p.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {p.createdAt?.toDate?.()?.toLocaleString?.() ?? '—'}
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
