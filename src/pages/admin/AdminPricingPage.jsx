import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { updatePricingConfigLocal } from '../../lib/dbUpdates';
import { AdminLayout } from '../../components/AdminLayout';

export const AdminPricingPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [courseFee, setCourseFee] = useState('');
  const [joiningFee, setJoiningFee] = useState('');
  const [retakeFee, setRetakeFee] = useState('');
  const [reactivationFee, setReactivationFee] = useState('');
  const [employerSubscriptionFee, setEmployerSubscriptionFee] = useState('');
  const [cv5, setCv5] = useState('');
  const [cv4, setCv4] = useState('');
  const [cv3, setCv3] = useState('');
  const [cv2, setCv2] = useState('');
  const [cv1, setCv1] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'pricing_config', 'default'));
        if (snap.exists()) {
          const d = snap.data();
          setConfig(d);
          setCourseFee(String(d.courseFee ?? ''));
          setJoiningFee(String(d.joiningFee ?? ''));
          setRetakeFee(String(d.retakeFee ?? ''));
          setReactivationFee(String(d.reactivationFee ?? ''));
          setEmployerSubscriptionFee(String(d.employerSubscriptionFee ?? ''));
          const cv = d.cvUnlockPricing || {};
          setCv5(String(cv['5-star'] ?? ''));
          setCv4(String(cv['4-star'] ?? ''));
          setCv3(String(cv['3-star'] ?? ''));
          setCv2(String(cv['2-star'] ?? ''));
          setCv1(String(cv['1-star'] ?? ''));
        }
      } catch (err) {
        setError('Failed to load pricing');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      await updatePricingConfigLocal(db, {
        courseFee: courseFee ? parseInt(courseFee, 10) : undefined,
        joiningFee: joiningFee ? parseInt(joiningFee, 10) : undefined,
        retakeFee: retakeFee ? parseInt(retakeFee, 10) : undefined,
        reactivationFee: reactivationFee ? parseInt(reactivationFee, 10) : undefined,
        employerSubscriptionFee: employerSubscriptionFee ? parseInt(employerSubscriptionFee, 10) : undefined,
        cvUnlockPricing: {
          '5-star': cv5 ? parseInt(cv5, 10) : undefined,
          '4-star': cv4 ? parseInt(cv4, 10) : undefined,
          '3-star': cv3 ? parseInt(cv3, 10) : undefined,
          '2-star': cv2 ? parseInt(cv2, 10) : undefined,
          '1-star': cv1 ? parseInt(cv1, 10) : undefined
        }
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
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
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Pricing & Plans</h1>
      <p className="text-gray-600 text-sm mb-6">All amounts in pence (e.g. 5000 = £50.00).</p>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm mb-4">
          Pricing updated.
        </div>
      )}
      <form onSubmit={handleSubmit} className="card max-w-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course fee (pence)</label>
            <input type="number" value={courseFee} onChange={(e) => setCourseFee(e.target.value)} className="input w-full" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Joining fee (pence)</label>
            <input type="number" value={joiningFee} onChange={(e) => setJoiningFee(e.target.value)} className="input w-full" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Retake fee (pence)</label>
            <input type="number" value={retakeFee} onChange={(e) => setRetakeFee(e.target.value)} className="input w-full" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reactivation fee (pence)</label>
            <input type="number" value={reactivationFee} onChange={(e) => setReactivationFee(e.target.value)} className="input w-full" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employer subscription (pence/month)</label>
            <input type="number" value={employerSubscriptionFee} onChange={(e) => setEmployerSubscriptionFee(e.target.value)} className="input w-full" min="0" />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">CV unlock pricing (pence per star tier)</h3>
          <div className="flex flex-wrap gap-4">
            {[
              { label: '5-star', value: cv5, set: setCv5 },
              { label: '4-star', value: cv4, set: setCv4 },
              { label: '3-star', value: cv3, set: setCv3 },
              { label: '2-star', value: cv2, set: setCv2 },
              { label: '1-star', value: cv1, set: setCv1 }
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="block text-xs text-gray-500">{label}</label>
                <input type="number" value={value} onChange={(e) => set(e.target.value)} className="input w-24" min="0" />
              </div>
            ))}
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save pricing'}
        </button>
      </form>
    </AdminLayout>
  );
};
