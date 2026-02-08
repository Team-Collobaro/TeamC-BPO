import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { updateInternshipApplicationLocal } from '../../lib/dbUpdates';
import { AdminLayout } from '../../components/AdminLayout';

export const AdminInternshipsPage = () => {
  const [applications, setApplications] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState('pending'); // pending | accepted | rejected | waitlisted | all
  const [decisionNotes, setDecisionNotes] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [configSnap, appSnap] = await Promise.all([
          getDoc(doc(db, 'system_config', 'default')),
          getDocs(query(collection(db, 'internship_applications'), orderBy('appliedAt', 'desc')))
        ]);
        if (configSnap.exists()) setConfig(configSnap.data());
        setApplications(appSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        setError('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateStatus = async (applicationId, status) => {
    setError(null);
    setUpdating(applicationId);
    try {
      await updateInternshipApplicationLocal(db, applicationId, {
        status,
        decisionNotes: decisionNotes[applicationId] || null
      });
      setApplications((prev) =>
        prev.map((a) =>
          a.id === applicationId
            ? { ...a, status, decisionNotes: decisionNotes[applicationId], reviewedAt: new Date(), reviewedBy: 'you' }
            : a
        )
      );
      setDecisionNotes((prev) => ({ ...prev, [applicationId]: undefined }));
    } catch (err) {
      setError(err.message || 'Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  const filtered =
    filter === 'all'
      ? applications
      : applications.filter((a) => a.status === filter);

  const acceptedCount = applications.filter((a) => a.status === 'accepted').length;
  const slots = config?.internshipSlots ?? 10;

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
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Internship Applications</h1>
      <p className="text-gray-600 mb-4">
        Slots: {acceptedCount} / {slots} accepted
      </p>

      <div className="flex gap-2 mb-6">
        {['pending', 'accepted', 'waitlisted', 'rejected', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f}
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
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Learner</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Availability</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Decision notes</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No applications match the filter.
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <tr key={app.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{app.learnerId}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {app.appliedAt?.toDate?.()?.toLocaleDateString?.() ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{app.availability || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        app.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : app.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : app.status === 'waitlisted'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {app.status === 'pending' ? (
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={decisionNotes[app.id] ?? ''}
                        onChange={(e) =>
                          setDecisionNotes((prev) => ({ ...prev, [app.id]: e.target.value }))
                        }
                        className="input w-40 text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-500">{app.decisionNotes || '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {app.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => updateStatus(app.id, 'accepted')}
                          disabled={updating === app.id || acceptedCount >= slots}
                          className="btn-primary text-sm py-1 px-2"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, 'waitlisted')}
                          disabled={updating === app.id}
                          className="btn-secondary text-sm py-1 px-2"
                        >
                          Waitlist
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, 'rejected')}
                          disabled={updating === app.id}
                          className="border border-red-300 text-red-700 rounded px-2 py-1 text-sm hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {updating === app.id && (
                      <span className="text-sm text-gray-500">Updating...</span>
                    )}
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
