import { EmployerLayout } from '../../components/EmployerLayout';

export const EmployerDashboardPage = () => {
  return (
    <EmployerLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Employer Dashboard</h1>
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Subscription</h2>
        <p className="text-gray-600 text-sm mb-4">
          Subscribe to access the candidate pool. Filter by star rating and pay to unlock CV/contact.
        </p>
        <a href="/employer/subscription" className="btn-primary inline-block">
          View Subscription
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Active candidates</p>
          <p className="text-2xl font-bold text-gray-900">—</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Shortlisted</p>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">CVs unlocked</p>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
      </div>
    </EmployerLayout>
  );
};
