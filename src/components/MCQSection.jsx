import { useState, useEffect } from 'react';

export const MCQSection = ({ mcqQuestions, onSubmit, isLocked, isSubmitting }) => {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  // Track state changes for debugging
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MCQSection.jsx:useEffect',message:'State changed',data:{showResults,hasResults:!!results,resultsKeys:results?Object.keys(results):[]},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [showResults, results]);

  const handleAnswerChange = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MCQSection.jsx:15',message:'handleSubmit called - START',data:{answersCount:Object.keys(answers).length,questionsCount:mcqQuestions.length,answers:answers,isSubmitting},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    console.log('🔍 [MCQ DEBUG] handleSubmit called', { answers, mcqQuestions });
    
    // Check if all questions are answered
    if (Object.keys(answers).length !== mcqQuestions.length) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MCQSection.jsx:18',message:'Validation failed - answer count mismatch',data:{answersCount:Object.keys(answers).length,questionsCount:mcqQuestions.length},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      alert('Please answer all questions before submitting.');
      return;
    }

    // Validate all answers are provided
    const missingAnswers = mcqQuestions.filter(q => 
      answers[q.id] === undefined || answers[q.id] === null
    );
    if (missingAnswers.length > 0) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MCQSection.jsx:26',message:'Validation failed - missing answers',data:{missingCount:missingAnswers.length,missingIds:missingAnswers.map(q=>q.id)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      alert(`Please answer all questions. You have ${missingAnswers.length} unanswered question(s).`);
      return;
    }

    try {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MCQSection.jsx:31',message:'Calling onSubmit',data:{answers:answers,isSubmitting},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      const result = await onSubmit(answers);
      
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MCQSection.jsx:33',message:'onSubmit returned result',data:{result:result,hasResult:!!result,resultKeys:result?Object.keys(result):[],hasAnswerResults:!!result?.answerResults,answerResultsLength:result?.answerResults?.length},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      
      if (result) {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MCQSection.jsx:34',message:'Setting results and showing',data:{result:result},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        setResults(result);
        setShowResults(true);
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MCQSection.jsx:36',message:'Result is falsy - not showing results',data:{result:result},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MCQSection.jsx:38',message:'Error in handleSubmit',data:{errorMessage:error?.message,errorName:error?.name,errorStack:error?.stack},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      console.error('Error submitting MCQ:', error);
      alert(error.message || 'Failed to submit answers. Please try again.');
    }
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

  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MCQSection.jsx:88',message:'Component render check',data:{showResults,hasResults:!!results,isLocked,answerResultsLength:results?.answerResults?.length},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (showResults && results) {
    const answerResults = results.answerResults || [];
    
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MCQSection.jsx:92',message:'Rendering results view',data:{answerResultsLength:answerResults.length,results:results},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    
    return (
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Quiz Results</h2>
        
        {/* Score Summary */}
        <div className={`mb-6 p-4 rounded-lg text-center ${
          results.passed ? 'bg-green-50 border-2 border-green-200' : 'bg-blue-50 border-2 border-blue-200'
        }`}>
          <p className={`text-3xl font-bold mb-2 ${
            results.passed ? 'text-green-800' : 'text-blue-800'
          }`}>
            {results.score}%
          </p>
          <p className={`text-sm ${
            results.passed ? 'text-green-700' : 'text-blue-700'
          }`}>
            {results.correctCount} out of {results.totalQuestions} questions correct
          </p>
          {results.passed && (
            <p className="text-green-600 mt-2 font-medium">
              🎉 Perfect Score! Next module unlocked!
            </p>
          )}
        </div>

        {/* Answer Review */}
        {answerResults.length > 0 && (
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Answer Review</h3>
            <div className="space-y-4">
              {mcqQuestions.map((question, index) => {
                const answerResult = answerResults[index];
                if (!answerResult) return null;
                
                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-lg border-2 ${
                      answerResult.isCorrect
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        answerResult.isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {answerResult.isCorrect ? (
                          <span className="text-white text-sm font-bold">✓</span>
                        ) : (
                          <span className="text-white text-sm font-bold">✗</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Question {index + 1}: {question.question}
                        </h4>
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => {
                            const isSelected = answerResult.selectedIndex === optIndex;
                            const isCorrect = answerResult.correctIndex === optIndex;
                            
                            return (
                              <div
                                key={optIndex}
                                className={`p-2 rounded-lg border-2 ${
                                  isCorrect
                                    ? 'bg-green-100 border-green-300'
                                    : isSelected
                                    ? 'bg-red-100 border-red-300'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex-shrink-0">
                                    {isCorrect && (
                                      <span className="text-green-600 font-bold text-sm">✓ Correct</span>
                                    )}
                                    {isSelected && !isCorrect && (
                                      <span className="text-red-600 font-bold text-sm">✗ Your Answer</span>
                                    )}
                                    {!isSelected && !isCorrect && (
                                      <span className="text-gray-500 text-xs">Option {optIndex + 1}</span>
                                    )}
                                  </div>
                                  <span className={`flex-1 ${
                                    isCorrect ? 'text-green-900 font-medium' : 
                                    isSelected ? 'text-red-900 font-medium' : 
                                    'text-gray-700'
                                  }`}>
                                    {option}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t pt-4 mt-6">
          {results.passed ? (
            <p className="text-center text-green-700 font-medium mb-4">
              ✅ Module completed! You can continue to the next module.
            </p>
          ) : (
            <button
              onClick={handleRetry}
              className="btn-primary w-full"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Multiple Choice Questions</h2>
      <p className="text-sm text-gray-600 mb-6">
        Answer all questions and submit. Your answers will be saved and marked.
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
