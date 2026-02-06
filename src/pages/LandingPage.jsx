import { Link } from 'react-router-dom';
import { ROLES } from '../lib/firebase';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="text-xl font-bold text-primary-600">
              UK BPO Learning
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/learn" className="text-sm text-gray-600 hover:text-gray-900">
                Learn
              </Link>
              <Link to="/candidates" className="text-sm text-gray-600 hover:text-gray-900">
                Candidates
              </Link>
              <Link to="/employers" className="text-sm text-gray-600 hover:text-gray-900">
                Employers
              </Link>
              <Link to="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link
                to="/login"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Login / Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          UK BPO Learning & Recruitment
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Learn BPO skills, get certified, and connect with employers. Or hire rated candidates.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Link
            to={`/login?role=${ROLES.LEARNER}`}
            className="card hover:shadow-lg transition-shadow text-left"
          >
            <h2 className="text-xl font-bold text-primary-600 mb-2">I'm a Learner</h2>
            <p className="text-gray-600 text-sm">
              New to UK bookkeeping? Take the course, pass the assessment, get your star rating and
              certificate. Optionally apply for internship at 5★.
            </p>
            <span className="inline-block mt-4 text-primary-600 font-medium text-sm">
              Get started →
            </span>
          </Link>
          <Link
            to={`/login?role=${ROLES.CANDIDATE}`}
            className="card hover:shadow-lg transition-shadow text-left"
          >
            <h2 className="text-xl font-bold text-primary-600 mb-2">I'm a Candidate</h2>
            <p className="text-gray-600 text-sm">
              Already in UK BPO? Pay joining fee, take the questionnaire, get rated and visible to
              employers.
            </p>
            <span className="inline-block mt-4 text-primary-600 font-medium text-sm">
              Join as candidate →
            </span>
          </Link>
          <Link
            to={`/login?role=${ROLES.EMPLOYER}`}
            className="card hover:shadow-lg transition-shadow text-left"
          >
            <h2 className="text-xl font-bold text-primary-600 mb-2">I'm a UK BPO Employer</h2>
            <p className="text-gray-600 text-sm">
              Subscribe to view the shortlist pool. Filter by star rating. Pay to unlock CV/contact
              and start hiring.
            </p>
            <span className="inline-block mt-4 text-primary-600 font-medium text-sm">
              Subscribe →
            </span>
          </Link>
        </div>

        <div className="border-t pt-12">
          <p className="text-gray-500 text-sm">
            Benefits • How it works • Trusted by UK BPO firms
          </p>
        </div>
      </main>
    </div>
  );
};
