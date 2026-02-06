import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { LearnerLayout } from '../../components/LearnerLayout';

export const CertificateViewPage = () => {
  const { certId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!certId) return;
      try {
        const snap = await getDoc(doc(db, 'certificates', certId));
        if (snap.exists() && snap.data().userId === user?.uid) {
          setCert({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [certId, user?.uid]);

  if (loading) {
    return (
      <LearnerLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </LearnerLayout>
    );
  }

  if (!cert) {
    return (
      <LearnerLayout>
        <div className="card">
          <p className="text-gray-600">Certificate not found.</p>
          <button onClick={() => navigate('/learner/dashboard')} className="btn-primary mt-4">
            Back to Dashboard
          </button>
        </div>
      </LearnerLayout>
    );
  }

  return (
    <LearnerLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Certificate</h1>
      <div className="card max-w-2xl border-2 border-primary-200 bg-primary-50/30">
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-1">Certificate of Completion</p>
          <p className="text-lg font-bold text-gray-900 mb-4">UK BPO Learning</p>
          <p className="text-sm text-gray-600 mb-2">Certificate number: {cert.certificateNumber}</p>
          <p className="text-2xl font-bold text-primary-600 mb-2">Score: {cert.score}%</p>
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={s <= cert.starRating ? 'text-amber-400' : 'text-gray-300'}>
                ★
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500">Issued: {cert.issuedAt?.toDate?.()?.toLocaleDateString() ?? '—'}</p>
        </div>
      </div>
      <button onClick={() => navigate('/learner/dashboard')} className="btn-primary mt-4">
        Back to Dashboard
      </button>
    </LearnerLayout>
  );
};
