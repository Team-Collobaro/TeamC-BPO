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
  const correctCount = state.correctCount ?? 0;
  const totalQuestions = state.totalQuestions ?? 0;
  const questionResults = state.questionResults ?? [];

  const isFiveStar = starRating === 5;

  return (
    <LearnerLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Results & Certificate</h1>

      <div className="card max-w-2xl mb-6">
        <div className="text-center mb-6">
          <p className="text-4xl font-bold text-primary-600 mb-2">{score}%</p>
          <p className="text-gray-600 mb-2">
            {correctCount} out of {totalQuestions} questions correct
          </p>
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

        {/* Question Results Section */}
        {questionResults.length > 0 && (
          <div className="border-t pt-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Question Review</h2>
            <div className="space-y-4">
              {questionResults.map((result, index) => (
                <div
                  key={result.questionId || index}
                  className={`p-4 rounded-lg border-2 ${
                    result.isCorrect
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      result.isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {result.isCorrect ? (
                        <span className="text-white text-sm font-bold">✓</span>
                      ) : (
                        <span className="text-white text-sm font-bold">✗</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">
                        Question {index + 1}: {result.question}
                      </h3>
                      <div className="space-y-2">
                        {result.options?.map((option, optIndex) => {
                          const isSelected = result.selectedIndex === optIndex;
                          const isCorrect = result.correctIndex === optIndex;
                          
                          return (
                            <div
                              key={optIndex}
                              className={`p-3 rounded-lg border-2 ${
                                isCorrect
                                  ? 'bg-green-100 border-green-400'
                                  : isSelected
                                  ? 'bg-red-100 border-red-400'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-shrink-0 mt-0.5">
                                  {isCorrect && (
                                    <span className="text-green-600 font-bold text-lg">✓</span>
                                  )}
                                  {isSelected && !isCorrect && (
                                    <span className="text-red-600 font-bold text-lg">✗</span>
                                  )}
                                  {!isSelected && !isCorrect && (
                                    <span className="text-gray-400 text-sm">○</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {isCorrect && (
                                      <span className="text-green-700 font-semibold text-sm">Correct Answer</span>
                                    )}
                                    {isSelected && !isCorrect && (
                                      <span className="text-red-700 font-semibold text-sm">Your Answer (Incorrect)</span>
                                    )}
                                    {!isSelected && !isCorrect && (
                                      <span className="text-gray-500 text-xs">Option {optIndex + 1}</span>
                                    )}
                                  </div>
                                  <span className={`block ${
                                    isCorrect ? 'text-green-900 font-medium' : 
                                    isSelected ? 'text-red-900 font-medium' : 
                                    'text-gray-700'
                                  }`}>
                                    {option}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
