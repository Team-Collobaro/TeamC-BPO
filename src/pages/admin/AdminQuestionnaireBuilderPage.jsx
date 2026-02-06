import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminLayout } from '../../components/AdminLayout';

export const AdminQuestionnaireBuilderPage = () => {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [mcqQuestions, setMcqQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesError, setModulesError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadModules(selectedCourseId);
    } else {
      setModules([]);
      setSelectedModule(null);
      setMcqQuestions([]);
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    try {
      const snap = await getDocs(collection(db, 'courses'));
      const coursesData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourses(coursesData);
    } catch (err) {
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async (courseId) => {
    if (!courseId) {
      setModules([]);
      return;
    }

    setModulesLoading(true);
    setModulesError(null);
    setSelectedModule(null);
    setMcqQuestions([]);

    try {
      // Try with orderBy first
      try {
        const modulesQuery = query(
          collection(db, 'courses', courseId, 'modules'),
          orderBy('order')
        );
        const snap = await getDocs(modulesQuery);
        const modulesData = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setModules(modulesData);
      } catch (orderByError) {
        // If orderBy fails (no order field), try without it
        console.warn('orderBy failed, trying without order:', orderByError);
        const modulesRef = collection(db, 'courses', courseId, 'modules');
        const snap = await getDocs(modulesRef);
        const modulesData = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort manually by order if it exists
        modulesData.sort((a, b) => (a.order || 0) - (b.order || 0));
        setModules(modulesData);
      }
    } catch (err) {
      console.error('Error loading modules:', err);
      setModulesError(err.message || 'Failed to load videos');
      setModules([]);
    } finally {
      setModulesLoading(false);
    }
  };

  const handleModuleSelect = (module) => {
    setSelectedModule(module);
    setMcqQuestions(module.mcq || []);
  };

  const addQuestion = () => {
    setMcqQuestions([...mcqQuestions, {
      id: `q${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    }]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...mcqQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setMcqQuestions(updated);
  };

  const updateOption = (qIndex, optionIndex, value) => {
    const updated = [...mcqQuestions];
    updated[qIndex].options[optionIndex] = value;
    setMcqQuestions(updated);
  };

  const removeQuestion = (index) => {
    setMcqQuestions(mcqQuestions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedModule || !selectedCourseId) {
      alert('Please select a module first');
      return;
    }

    // Validate questions
    const hasEmptyFields = mcqQuestions.some(q => 
      !q.question.trim() || q.options.some(opt => !opt.trim())
    );

    if (hasEmptyFields) {
      alert('Please fill in all question and option fields');
      return;
    }

    setSaving(true);
    try {
      const moduleRef = doc(db, 'courses', selectedCourseId, 'modules', selectedModule.id);
      await updateDoc(moduleRef, {
        mcq: mcqQuestions
      });

      alert('Questions saved successfully! ✅');
      
      // Reload modules to update the list
      await loadModules(selectedCourseId);
      
      // Update selected module
      const updatedModule = { ...selectedModule, mcq: mcqQuestions };
      setSelectedModule(updatedModule);
    } catch (err) {
      console.error('Error saving questions:', err);
      alert('Failed to save questions. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Questionnaire Builder</h1>
        <p className="text-gray-600 mt-1">Select a video and add quiz questions for learners</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Selection */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Select Course</h2>
          {courses.length === 0 ? (
            <p className="text-gray-500 text-sm">No courses available</p>
          ) : (
            <div className="space-y-2">
              {courses.map(course => (
                <button
                  key={course.id}
                  onClick={() => {
                    setSelectedCourseId(course.id);
                    setSelectedModule(null);
                    setMcqQuestions([]);
                    setModulesError(null);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                    selectedCourseId === course.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{course.title}</div>
                  {course.description && (
                    <div className="text-xs text-gray-500 mt-1">{course.description}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Module/Video Selection */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Select Video</h2>
          {!selectedCourseId ? (
            <p className="text-gray-500 text-sm">Please select a course first</p>
          ) : modulesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-sm text-gray-600">Loading videos...</span>
            </div>
          ) : modulesError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium mb-1">Error loading videos</p>
              <p className="text-xs text-red-600">{modulesError}</p>
              <button
                onClick={() => loadModules(selectedCourseId)}
                className="mt-2 text-xs text-red-700 hover:text-red-900 underline"
              >
                Try again
              </button>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-2">No videos in this course</p>
              <p className="text-xs text-gray-400">
                Add videos in <strong>Courses & Library</strong> first
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {modules.map(module => (
                <button
                  key={module.id}
                  onClick={() => handleModuleSelect(module)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                    selectedModule?.id === module.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400">#{module.order}</span>
                        <span className="font-medium">{module.title}</span>
                      </div>
                      {module.description && (
                        <div className="text-xs text-gray-500 mt-1">{module.description}</div>
                      )}
                    </div>
                    {module.mcq && module.mcq.length > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {module.mcq.length} Q
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Questions Builder */}
        <div className="card lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">3. Build Questions</h2>
              {selectedModule && (
                <p className="text-xs text-gray-500 mt-1">For: {selectedModule.title}</p>
              )}
            </div>
            {selectedModule && (
              <button
                onClick={addQuestion}
                className="text-sm bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                + Add Question
              </button>
            )}
          </div>

          {!selectedModule ? (
            <p className="text-gray-500 text-sm">Please select a video first</p>
          ) : mcqQuestions.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-500">No questions yet</p>
              <p className="text-xs text-gray-400 mt-1">Click "+ Add Question" to start</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {mcqQuestions.map((question, qIndex) => (
                <div key={question.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Question {qIndex + 1}</span>
                    <button
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>

                  <textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                    placeholder="Enter your question"
                    rows={2}
                    className="input-field mb-3 resize-none"
                  />

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600">Answer Options:</p>
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-start gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={question.correctAnswer === optIndex}
                          onChange={() => updateQuestion(qIndex, 'correctAnswer', optIndex)}
                          className="w-4 h-4 text-primary-600 mt-2"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                            placeholder={`Option ${optIndex + 1}`}
                            className="input-field"
                          />
                        </div>
                        {question.correctAnswer === optIndex && (
                          <span className="text-xs text-green-600 font-medium mt-2 whitespace-nowrap">
                            ✓ Correct
                          </span>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">
                      Click the radio button to mark the correct answer
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedModule && mcqQuestions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full btn-primary"
              >
                {saving ? 'Saving...' : 'Save Questions'}
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
