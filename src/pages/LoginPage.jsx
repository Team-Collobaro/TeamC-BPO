import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../lib/firebase';

const ROLE_LABELS = {
  [ROLES.LEARNER]: "I'm a Learner",
  [ROLES.CANDIDATE]: "I'm a Candidate",
  [ROLES.EMPLOYER]: "I'm a UK BPO Employer"
};

export const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get('role');
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState(
    roleFromUrl && [ROLES.LEARNER, ROLES.CANDIDATE, ROLES.EMPLOYER].includes(roleFromUrl)
      ? roleFromUrl
      : ROLES.LEARNER
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyRegNumber, setCompanyRegNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const getRedirectPath = () => {
    if (!role) return '/dashboard';
    if (role === ROLES.LEARNER) return '/learner/dashboard';
    if (role === ROLES.CANDIDATE) return '/candidate/dashboard';
    if (role === ROLES.EMPLOYER) return '/employer/dashboard';
    return '/dashboard';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const profile =
          role === ROLES.EMPLOYER
            ? { displayName, companyName, companyRegNumber }
            : { displayName };
        await signUp(email, password, role, profile);
        await new Promise((r) => setTimeout(r, 500));
        navigate(getRedirectPath());
      } else {
        await signIn(email, password);
        navigate(getRedirectPath());
      }
    } catch (err) {
      const code = err.code || '';
      const message =
        code === 'auth/email-already-in-use'
          ? 'This email is already registered. Sign in or use a different email.'
          : code === 'auth/invalid-email'
          ? 'Please enter a valid email address.'
          : code === 'auth/weak-password'
          ? 'Password should be at least 6 characters.'
          : code === 'auth/operation-not-allowed'
          ? 'Email/password sign-up is not enabled. Check your Firebase Auth settings.'
          : code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found'
          ? 'Invalid email or password.'
          : err.message || 'Authentication failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">UK BPO Learning</h1>
          <p className="text-gray-600">Master BPO skills and connect with employers</p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          {isSignUp && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a
              </label>
              <div className="flex flex-wrap gap-2">
                {[ROLES.LEARNER, ROLES.CANDIDATE, ROLES.EMPLOYER].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      role === r
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-field"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            )}

            {isSignUp && role === ROLES.EMPLOYER && (
              <>
                <div>
                  <label
                    htmlFor="companyName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Company name
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="input-field"
                    placeholder="Company Ltd"
                  />
                </div>
                <div>
                  <label
                    htmlFor="companyRegNumber"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Company registration number (optional)
                  </label>
                  <input
                    id="companyRegNumber"
                    type="text"
                    value={companyRegNumber}
                    onChange={(e) => setCompanyRegNumber(e.target.value)}
                    className="input-field"
                    placeholder="Optional"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input-field"
                placeholder="••••••••"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
