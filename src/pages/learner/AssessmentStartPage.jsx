import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { LearnerLayout } from '../../components/LearnerLayout';

const DEFAULT_QUESTIONNAIRE_ID = 'final-assessment';

export const AssessmentStartPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'questionnaires', DEFAULT_QUESTIONNAIRE_ID));
        if (docSnap.exists()) {
          setQuestionnaire({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Questionnaire not found. Please contact support.');
        }
      } catch (err) {
        setError('Failed to load questionnaire');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAnswer = (questionId, selectedIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selectedIndex }));
  };

  const handleNext = () => {
    if (currentStep < (questionnaire?.questions?.length ?? 1) - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    const questions = questionnaire?.questions ?? [];
    if (Object.keys(answers).length !== questions.length) {
      alert('Please answer all questions.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const answersArray = questions.map((q) => answers[q.id]);
      const submitAssessment = httpsCallable(functions, 'submitAssessment');
      const result = await submitAssessment({
        questionnaireId: questionnaire.id,
        answers: answersArray,
        courseId: null
      });
      navigate('/learner/assessment/results', {
        state: {
          score: result.data.score,
          starRating: result.data.starRating,
          certificateId: result.data.certificateId,
          certificateNumber: result.data.certificateNumber,
          passed: result.data.passed
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LearnerLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </LearnerLayout>
    );
  }

  if (error && !questionnaire) {
    return (
      <LearnerLayout>
        <div className="card">
          <p className="text-red-600">{error}</p>
          <button onClick={() => navigate('/learner/dashboard')} className="btn-secondary mt-4">
            Back to Dashboard
          </button>
        </div>
      </LearnerLayout>
    );
  }

  const questions = questionnaire?.questions ?? [];
  const question = questions[currentStep];
  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  return (
    <LearnerLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{questionnaire?.title ?? 'Final Questionnaire'}</h1>
      <p className="text-gray-600 text-sm mb-6">
        Question {currentStep + 1} of {questions.length}
      </p>

      {error && (
        <div className="card mb-4 bg-red-50 border border-red-200">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="card max-w-2xl">
        {question && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{question.question}</h2>
            <div className="space-y-2">
              {question.options?.map((option, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    answers[question.id] === idx ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    checked={answers[question.id] === idx}
                    onChange={() => handleAnswer(question.id, idx)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          {currentStep < questions.length - 1 ? (
            <button onClick={handleNext} className="btn-primary">
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </LearnerLayout>
  );
};
