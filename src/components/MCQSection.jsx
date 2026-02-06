import { useState } from 'react';

export const MCQSection = ({ mcqQuestions, onSubmit, isLocked, isSubmitting }) => {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  const handleAnswerChange = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (Object.keys(answers).length !== mcqQuestions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    const result = await onSubmit(answers);
    setResults(result);
    setShowResults(true);
  };

  const handleRetry = () => {
    setAnswers({});
    setShowResults(false);
    setResults(null);
  };

  if (isLocked) {
    return (
      <div className="card opacity-60">
        <h2 className="text-xl font-semibold mb-4">Multiple Choice Questions</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">🔒 Complete the video first to unlock the MCQ</p>
        </div>
      </div>
    );
  }

  if (showResults && results) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Quiz Results</h2>
        
        {results.passed ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">Congratulations!</h3>
            <p className="text-green-700 mb-4">
              You scored {results.score}% - Perfect Score!
            </p>
            <p className="text-green-600">
              Next module unlocked! Return to dashboard to continue.
            </p>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-2xl font-bold text-red-800 mb-2">Not Quite There</h3>
            <p className="text-red-700 mb-4">
              You scored {results.score}%. You need 100% to pass.
            </p>
            <button
              onClick={handleRetry}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Multiple Choice Questions</h2>
      <p className="text-sm text-gray-600 mb-6">
        You must score 100% to unlock the next module.
      </p>
      
      <div className="space-y-6">
        {mcqQuestions.map((question, qIndex) => (
          <div key={question.id} className="border-b pb-6 last:border-b-0">
            <h3 className="font-medium text-gray-900 mb-3">
              {qIndex + 1}. {question.question}
            </h3>
            
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    answers[question.id] === optionIndex
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={answers[question.id] === optionIndex}
                    onChange={() => handleAnswerChange(question.id, optionIndex)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || Object.keys(answers).length !== mcqQuestions.length}
        className="btn-primary w-full mt-6"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Answers'}
      </button>
    </div>
  );
};
