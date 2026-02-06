import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { LearnerLayout } from '../../components/LearnerLayout';
import { ModuleCard } from '../../components/ModuleCard';

export const LearnerLibraryPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadModulesAndProgress();
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    try {
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesData = coursesSnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setCourses(coursesData);
      if (coursesData.length > 0) {
        setSelectedCourseId(coursesData[0].id);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadModulesAndProgress = async () => {
    setLoading(true);
    try {
      const modulesQuery = query(
        collection(db, 'courses', selectedCourseId, 'modules'),
        orderBy('order')
      );
      const modulesSnapshot = await getDocs(modulesQuery);
      const modulesData = modulesSnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setModules(modulesData);

      const progressDoc = await getDoc(
        doc(db, 'users', user.uid, 'progress', selectedCourseId)
      );
      if (progressDoc.exists()) {
        setProgress(progressDoc.data());
      } else {
        setProgress({ unlockedModuleOrder: 1, completedModules: {} });
      }
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModuleStatus = (module) => {
    if (!progress?.completedModules) return 'video';
    const moduleProgress = progress.completedModules[module.id];
    if (!moduleProgress) return 'video';
    if (moduleProgress.mcqPassed) return 'completed';
    if (moduleProgress.videoCompleted) return 'mcq';
    return 'video';
  };

  const allModulesComplete =
    progress && modules.length > 0 && progress.unlockedModuleOrder > modules.length;

  if (loading) {
    return (
      <LearnerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </LearnerLayout>
    );
  }

  if (courses.length === 0) {
    return (
      <LearnerLayout>
        <div className="text-center py-12 card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Courses Available</h2>
          <p className="text-gray-600">Please contact your administrator to set up courses.</p>
        </div>
      </LearnerLayout>
    );
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <LearnerLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Knowledge Library</h1>

      {selectedCourse && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedCourse.title}</h2>
          <p className="text-gray-600 text-sm mb-4">{selectedCourse.description}</p>
          {progress && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">
                <span className="text-sm font-medium text-primary-700">
                  Progress: {progress.unlockedModuleOrder} of {modules.length} modules
                </span>
              </div>
              {allModulesComplete && (
                <Link to="/learner/assessment/disclaimer" className="btn-primary inline-block">
                  Start Final Questionnaire
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {modules.map((module) => {
          const isLocked = progress && module.order > progress.unlockedModuleOrder;
          const status = getModuleStatus(module);
          return (
            <ModuleCard
              key={module.id}
              module={module}
              courseId={selectedCourseId}
              isLocked={isLocked}
              status={status}
            />
          );
        })}
      </div>

      {!allModulesComplete && modules.length > 0 && (
        <div className="card mt-6 bg-amber-50 border border-amber-200">
          <p className="text-amber-800 text-sm">
            Complete 100% of modules to unlock the Final Questionnaire.
          </p>
        </div>
      )}
    </LearnerLayout>
  );
};
