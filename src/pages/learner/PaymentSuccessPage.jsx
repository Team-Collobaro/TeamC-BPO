import { useNavigate } from 'react-router-dom';
import { LearnerLayout } from '../../components/LearnerLayout';

export const PaymentSuccessPage = () => {
  const navigate = useNavigate();

  return (
    <LearnerLayout>
      <div className="card max-w-2xl text-center">
        <div className="text-6xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment successful</h1>
        <p className="text-gray-600 mb-6">
          Your payment has been processed. Course access has been unlocked.
        </p>
        <button onClick={() => navigate('/learner/library')} className="btn-primary">
          Go to Knowledge Library
        </button>
      </div>
    </LearnerLayout>
  );
};
