import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { respondToSurveyLocal } from '../lib/dbUpdates';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Layout } from '../components/Layout';

export const SurveyRespondPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [response, setResponse] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (value) => {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await respondToSurveyLocal(db, user.uid, { token, response: value });
      setSubmitted(true);
      setTimeout(() => {
        navigate(user?.role === 'candidate' ? '/candidate/dashboard' : '/learner/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <Layout>
        <div className="card max-w-md">
          <p className="text-gray-600">Invalid or missing survey link.</p>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="card max-w-md">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Job-seeking survey</h1>
          <p className="text-gray-600 text-sm mb-6">
            Are you currently open to job opportunities?
          </p>
          {submitted ? (
            <p className="text-green-600 font-medium">Thank you. Your response has been recorded.</p>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm mb-4">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSubmit('yes')}
                  disabled={submitting}
                  className="btn-primary"
                >
                  Yes, actively looking
                </button>
                <button
                  onClick={() => handleSubmit('maybe')}
                  disabled={submitting}
                  className="btn-secondary"
                >
                  Maybe / open to hearing
                </button>
                <button
                  onClick={() => handleSubmit('no')}
                  disabled={submitting}
                  className="btn-secondary"
                >
                  No, not looking
                </button>
              </div>
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
