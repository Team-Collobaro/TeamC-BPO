import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { LearnerLayout } from '../components/LearnerLayout';
import { ROLES } from '../lib/firebase';
import { VideoPlayer } from '../components/VideoPlayer';
import { MCQSection } from '../components/MCQSection';
import { ModuleSidebar } from '../components/ModuleSidebar';

export const ModulePage = () => {
  const { courseId, moduleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [module, setModule] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadModuleData();
  }, [courseId, moduleId]);

  const loadModuleData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load current module
      const moduleDoc = await getDoc(doc(db, 'courses', courseId, 'modules', moduleId));
      if (!moduleDoc.exists()) {
        setError('Module not found');
        return;
      }
      setModule({ id: moduleDoc.id, ...moduleDoc.data() });

      // Load all modules for sidebar
      const modulesQuery = query(
        collection(db, 'courses', courseId, 'modules'),
        orderBy('order')
      );
      const modulesSnapshot = await getDocs(modulesQuery);
      const modulesData = modulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setModules(modulesData);

      // Load progress
      const progressDoc = await getDoc(
        doc(db, 'users', user.uid, 'progress', courseId)
      );
      
      if (progressDoc.exists()) {
        setProgress(progressDoc.data());
        
        // Check if user has access to this module
        const moduleData = moduleDoc.data();
        const progressData = progressDoc.data();
        
        if (moduleData.order > progressData.unlockedModuleOrder) {
          setError('This module is locked. Complete previous modules first.');
        }
      } else {
        // Initialize progress
        const initialProgress = {
          unlockedModuleOrder: 1,
          completedModules: {}
        };
        setProgress(initialProgress);
        
        // Check if this is module 1
        if (moduleDoc.data().order > 1) {
          setError('This module is locked. Start with Module 1.');
        }
      }
    } catch (err) {
      console.error('Error loading module:', err);
      setError('Failed to load module');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoComplete = async () => {
    const checkbox = document.getElementById('watched-checkbox');
    if (!checkbox || !checkbox.checked) {
      alert('Please confirm that you have watched the video fully.');
      return;
    }

    try {
      const progressRef = doc(db, 'users', user.uid, 'progress', courseId);
      const currentProgress = progress || { unlockedModuleOrder: 1, completedModules: {} };
      
      // Use setDoc with merge to handle both new and existing documents
      const updatedProgress = {
        ...currentProgress,
        completedModules: {
          ...currentProgress.completedModules,
          [moduleId]: {
            ...currentProgress.completedModules?.[moduleId],
            videoCompleted: true
          }
        }
      };

      await setDoc(progressRef, updatedProgress, { merge: true });

      // Update local state
      setProgress(updatedProgress);
      
      alert('Video marked as complete! ✅');
    } catch (err) {
      console.error('Error marking video complete:', err);
      
      // If document doesn't exist, create it
      if (err.code === 'not-found') {
        try {
          const progressRef = doc(db, 'users', user.uid, 'progress', courseId);
          const newProgress = {
            unlockedModuleOrder: module.order,
            completedModules: {
              [moduleId]: {
                videoCompleted: true
              }
            }
          };
          
          await setDoc(progressRef, newProgress, { merge: true });
          setProgress(newProgress);
          alert('Video marked as complete! ✅');
        } catch (createErr) {
          console.error('Error creating progress:', createErr);
          alert('Failed to mark video as complete. Please try again.');
        }
      } else {
        alert('Failed to mark video as complete. Please try again.');
      }
    }
  };

  const handleMCQSubmit = async (answers) => {
    setIsSubmitting(true);
    
    try {
      // Convert answers object to array format
      const answersArray = module.mcq.map(question => answers[question.id]);
      
      // Call Cloud Function
      const submitMcq = httpsCallable(functions, 'submitMcq');
      const result = await submitMcq({
        courseId,
        moduleId,
        answers: answersArray
      });

      // Reload progress
      await loadModuleData();
      
      return result.data;
    } catch (err) {
      console.error('Error submitting MCQ:', err);
      alert('Failed to submit quiz. Please try again.');
      return { passed: false, score: 0 };
    } finally {
      setIsSubmitting(false);
    }
  };

  const Wrapper = user?.role === ROLES.LEARNER ? LearnerLayout : Layout;
  const backPath = user?.role === ROLES.LEARNER ? '/learner/library' : '/dashboard';

  if (loading) {
    return (
      <Wrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{error}</h2>
          <button onClick={() => navigate(backPath)} className="btn-primary">
            Back
          </button>
        </div>
      </Wrapper>
    );
  }

  if (!module) {
    return (
      <Wrapper>
        <div className="text-center py-12">
          <p className="text-gray-600">Module not found</p>
        </div>
      </Wrapper>
    );
  }

  const moduleProgress = progress?.completedModules?.[moduleId] || {};
  const videoCompleted = moduleProgress.videoCompleted || false;
  const mcqPassed = moduleProgress.mcqPassed || false;

  return (
    <Wrapper>
      <div className="mb-6">
        <button
          onClick={() => navigate(backPath)}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <ModuleSidebar
            modules={modules}
            courseId={courseId}
            currentModuleId={moduleId}
            unlockedModuleOrder={progress?.unlockedModuleOrder || 1}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-bold text-gray-300">#{module.order}</span>
              <h1 className="text-3xl font-bold text-gray-900">{module.title}</h1>
            </div>
            {module.description && (
              <p className="text-gray-600">{module.description}</p>
            )}
          </div>

          {mcqPassed ? (
            <div className="card bg-green-50 border-2 border-green-200">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-green-800 mb-2">Module Completed!</h2>
                <p className="text-green-700 mb-4">
                  Great job! You've mastered this module.
                </p>
                <button
                  onClick={() => navigate(backPath)}
                  className="btn-primary"
                >
                  Continue to Next Module
                </button>
              </div>
            </div>
          ) : (
            <>
              <VideoPlayer
                bunnyEmbedUrl={module.bunnyEmbedUrl}
                youtubeUrl={module.youtubeUrl}
                thumbnailUrl={module.thumbnailUrl}
                onVideoComplete={handleVideoComplete}
                videoCompleted={videoCompleted}
              />

              <MCQSection
                mcqQuestions={module.mcq || []}
                onSubmit={handleMCQSubmit}
                isLocked={!videoCompleted}
                isSubmitting={isSubmitting}
              />
            </>
          )}
        </div>
      </div>
    </Wrapper>
  );
};
