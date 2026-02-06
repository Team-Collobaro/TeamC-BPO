import { Link } from 'react-router-dom';
import { LearnerLayout } from '../../components/LearnerLayout';

export const LearnerDashboardPage = () => {
  return (
    <LearnerLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Learner Dashboard</h1>
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Progress</h2>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-primary-600 rounded-full" style={{ width: '0%' }} />
        </div>
        <p className="text-sm text-gray-600">0% complete — Complete all modules to unlock the Final Questionnaire.</p>
      </div>
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Continue Learning</h2>
        <p className="text-gray-600 text-sm mb-4">
          Final Questionnaire is locked until you complete 100% of the course.
        </p>
        <Link to="/learner/library" className="btn-primary inline-block">
          Go to Knowledge Library
        </Link>
      </div>
    </LearnerLayout>
  );
};
