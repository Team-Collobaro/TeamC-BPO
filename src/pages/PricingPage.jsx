import { Link } from 'react-router-dom';

export const PricingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="text-xl font-bold text-primary-600">
              UK BPO Learning
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link to="/login" className="text-sm font-medium text-primary-600">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pricing</h1>

        <div className="space-y-8 card mb-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Learner</h2>
            <p className="text-gray-600">
              Course fee: one-time payment to access the full course and final questionnaire. One
              attempt included. Retake requires full fee again.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Candidate</h2>
            <p className="text-gray-600">
              One-time joining fee to unlock the questionnaire. One attempt included. Resit requires
              full fee. Reactivation fee if profile goes inactive (48h rule).
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Employer</h2>
            <p className="text-gray-600">
              Monthly subscription for dashboard access. CV unlock pricing depends on candidate star
              rating (5★ = highest, 1★ = lowest).
            </p>
          </section>
          <p className="text-sm text-gray-500">
            All prices in GBP. Contact for exact amounts. Retake policy: full fee per resit.
          </p>
        </div>
      </main>
    </div>
  );
};
