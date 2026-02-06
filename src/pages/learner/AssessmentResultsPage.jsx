import { useNavigate, useLocation } from 'react-router-dom';
import { LearnerLayout } from '../../components/LearnerLayout';

export const AssessmentResultsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const score = state.score ?? 0;
  const starRating = state.starRating ?? 1;
  const certificateId = state.certificateId;
  const certificateNumber = state.certificateNumber ?? '—';
  const passed = state.passed ?? false;

  const isFiveStar = starRating === 5;

  return (
    <LearnerLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Results & Certificate</h1>

      <div className="card max-w-2xl mb-6">
        <div className="text-center mb-6">
          <p className="text-4xl font-bold text-primary-600 mb-2">{score}%</p>
          <p className="text-gray-600 mb-4">Star rating</p>
          <div className="flex justify-center gap-1" aria-label={`${starRating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`text-2xl ${s <= starRating ? 'text-amber-400' : 'text-gray-300'}`}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        <div className="border-t pt-4 mb-4">
          <p className="text-sm text-gray-600">
            Certificate number: <strong>{certificateNumber}</strong>
          </p>
          {certificateId && (
            <button
              onClick={() => navigate(`/learner/certificate/${certificateId}`)}
              className="btn-secondary mt-2"
            >
              View / Download Certificate
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/learner/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/learner/retake-payment')}
            className="btn-secondary"
          >
            Retake (Pay Full Fee)
          </button>
        </div>
      </div>

      {isFiveStar && (
        <div className="card max-w-2xl bg-amber-50 border border-amber-200">
          <h2 className="text-lg font-semibold text-amber-800 mb-2">5★ — Internship eligible</h2>
          <p className="text-amber-700 text-sm mb-4">
            You can apply for the internship program. 6 months unpaid, practical training.
          </p>
          <button
            onClick={() => navigate('/learner/internship')}
            className="btn-primary"
          >
            Apply for Internship
          </button>
        </div>
      )}
    </LearnerLayout>
  );
};
