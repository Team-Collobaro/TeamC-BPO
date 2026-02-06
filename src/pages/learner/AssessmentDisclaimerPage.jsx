import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LearnerLayout } from '../../components/LearnerLayout';

export const AssessmentDisclaimerPage = () => {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();

  return (
    <LearnerLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Final Questionnaire</h1>
      <div className="card max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Before you start</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
          <li>You get one attempt included with your course.</li>
          <li>If you resit to improve your star rating, you must pay the full fee again.</li>
        </ul>
        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-gray-700">I understand and agree</span>
        </label>
        <button
          onClick={() => navigate('/learner/assessment/start')}
          disabled={!accepted}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Final Questionnaire
        </button>
      </div>
    </LearnerLayout>
  );
};
