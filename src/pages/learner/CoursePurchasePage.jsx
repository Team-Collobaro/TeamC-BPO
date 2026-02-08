import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { demoUnlockLocal } from '../../lib/dbUpdates';
import { useAuth } from '../../contexts/AuthContext';
import { LearnerLayout } from '../../components/LearnerLayout';

export const CoursePurchasePage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!courseId) return;
      try {
        const [courseSnap, pricingSnap] = await Promise.all([
          getDoc(doc(db, 'courses', courseId)),
          getDoc(doc(db, 'pricing_config', 'default'))
        ]);
        if (courseSnap.exists()) setCourse({ id: courseSnap.id, ...courseSnap.data() });
        if (pricingSnap.exists()) setPricing(pricingSnap.data());
      } catch (err) {
        setError('Failed to load course');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const amount = course?.price ?? pricing?.courseFee ?? 5000;

  const handleUnlock = async () => {
    setUnlocking(true);
    setError(null);
    try {
      await demoUnlockLocal(db, user.uid, { type: 'course_purchase', courseId });
      navigate('/learner/library');
    } catch (err) {
      setError(err.message || 'Unlock failed');
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) {
    return (
      <LearnerLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </LearnerLayout>
    );
  }

  if (!course) {
    return (
      <LearnerLayout>
        <div className="card">
          <p className="text-gray-600">Course not found.</p>
          <button onClick={() => navigate('/learner/dashboard')} className="btn-primary mt-4">
            Back to Dashboard
          </button>
        </div>
      </LearnerLayout>
    );
  }

  return (
    <LearnerLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Course Purchase</h1>
      <div className="card max-w-2xl mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h2>
        <p className="text-gray-600 text-sm mb-4">{course.description}</p>
        <p className="text-2xl font-bold text-primary-600 mb-4">
          £{(amount / 100).toFixed(2)}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleUnlock}
          disabled={unlocking}
          className="btn-primary"
        >
          {unlocking ? 'Unlocking...' : 'Unlock course'}
        </button>
      </div>
    </LearnerLayout>
  );
};
