import { Link } from 'react-router-dom';
import { CandidateLayout } from '../../components/CandidateLayout';

export const CandidateDashboardPage = () => {
  return (
    <CandidateLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Candidate Dashboard</h1>
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Get Started</h2>
        <p className="text-gray-600 text-sm mb-4">
          Pay the joining fee to unlock the questionnaire. After completion you'll get your star
          rating and certificate, and can make your profile visible to employers.
        </p>
        <Link to="/candidate/joining-fee" className="btn-primary inline-block">
          Pay Joining Fee
        </Link>
      </div>
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Status</h2>
        <p className="text-gray-600 text-sm">Questionnaire: Locked until joining fee is paid.</p>
      </div>
    </CandidateLayout>
  );
};
