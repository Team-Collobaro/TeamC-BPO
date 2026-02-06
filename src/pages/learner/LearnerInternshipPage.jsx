import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { LearnerLayout } from '../../components/LearnerLayout';

export const LearnerInternshipPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [config, setConfig] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [availability, setAvailability] = useState('');
  const [preferredStartDate, setPreferredStartDate] = useState('');
  const [commitmentAgreed, setCommitmentAgreed] = useState(false);
  const [assessmentId, setAssessmentId] = useState('');

  const is5Star = profile?.latestStarRating === 5;
  const programEnabled = config?.internshipProgramEnabled !== false;

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      try {
        const [profileSnap, configSnap] = await Promise.all([
          getDoc(doc(db, 'learner_profiles', user.uid)),
          getDoc(doc(db, 'system_config', 'default'))
        ]);
        if (profileSnap.exists()) setProfile(profileSnap.data());
        if (configSnap.exists()) setConfig(configSnap.data());

        const appQuery = query(
          collection(db, 'internship_applications'),
          where('learnerId', '==', user.uid),
          orderBy('appliedAt', 'desc')
        );
        const appSnap = await getDocs(appQuery);
        setApplications(appSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        if (profileSnap.exists && profileSnap.data().latestStarRating === 5) {
          const assessQuery = query(
            collection(db, 'assessments'),
            where('userId', '==', user.uid),
            where('starRating', '==', 5)
          );
          const assessSnap = await getDocs(assessQuery);
          const sorted = assessSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.submittedAt?.toMillis?.() ?? 0) - (a.submittedAt?.toMillis?.() ?? 0));
          if (sorted.length) setAssessmentId(sorted[0].id);
        }
      } catch (err) {
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!assessmentId || !commitmentAgreed) {
      setError('You must agree to the commitment and have a 5-star assessment.');
      return;
    }
    setSubmitting(true);
    try {
      const apply = httpsCallable(functions, 'applyForInternship');
      await apply({
        assessmentId,
        availability: availability.trim(),
        preferredStartDate: preferredStartDate || null,
        commitmentAgreed: true
      });
      setSuccess('Application submitted. We will review and get back to you.');
      setCommitmentAgreed(false);
      setAvailability('');
      setPreferredStartDate('');
      const appQuery = query(
        collection(db, 'internship_applications'),
        where('learnerId', '==', user.uid),
        orderBy('appliedAt', 'desc')
      );
      const appSnap = await getDocs(appQuery);
      setApplications(appSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const hasPending = applications.some((a) => a.status === 'pending');

  if (loading) {
    return (
      <LearnerLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </LearnerLayout>
    );
  }

  return (
    <LearnerLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Internship Program</h1>

      {!programEnabled && (
        <div className="card max-w-2xl bg-gray-50 border border-gray-200 mb-6">
          <p className="text-gray-600">The internship program is currently closed. Check back later.</p>
        </div>
      )}

      {programEnabled && !is5Star && (
        <div className="card max-w-2xl bg-amber-50 border border-amber-200 mb-6">
          <h2 className="text-lg font-semibold text-amber-800 mb-2">Not yet eligible</h2>
          <p className="text-amber-700 text-sm">
            You need a 5-star rating on the final assessment to apply for the internship. Complete the course and pass the assessment to qualify.
          </p>
        </div>
      )}

      {programEnabled && is5Star && (
        <>
          <div className="card max-w-2xl mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Apply for internship</h2>
            <p className="text-gray-600 text-sm mb-4">
              6 months unpaid practical training. Slots are limited and subject to admin review.
            </p>

            {hasPending && (
              <p className="text-amber-700 text-sm mb-4">You have a pending application. We will notify you once it is reviewed.</p>
            )}

            {!hasPending && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                  <input
                    type="text"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    placeholder="e.g. Full-time from March"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred start date</label>
                  <input
                    type="date"
                    value={preferredStartDate}
                    onChange={(e) => setPreferredStartDate(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={commitmentAgreed}
                    onChange={(e) => setCommitmentAgreed(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">I agree to the 6-month unpaid internship commitment</span>
                </label>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">{error}</div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm">{success}</div>
                )}
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Submitting...' : 'Submit application'}
                </button>
              </form>
            )}
          </div>

          {applications.length > 0 && (
            <div className="card max-w-2xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">My applications</h2>
              <ul className="space-y-3">
                {applications.map((app) => (
                  <li key={app.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        Applied {app.appliedAt?.toDate?.()?.toLocaleDateString?.() ?? '—'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Status: <span className="font-medium">{app.status}</span>
                        {app.decisionNotes && ` — ${app.decisionNotes}`}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
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
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </LearnerLayout>
  );
};
