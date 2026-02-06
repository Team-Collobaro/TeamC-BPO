import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { ModuleCard } from '../components/ModuleCard';

export const DashboardPage = () => {
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
      const coursesData = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourses(coursesData);
      
      // Auto-select first course
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
      // Load modules
      const modulesQuery = query(
        collection(db, 'courses', selectedCourseId, 'modules'),
        orderBy('order')
      );
      const modulesSnapshot = await getDocs(modulesQuery);
      const modulesData = modulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setModules(modulesData);

      // Load user progress
      const progressDoc = await getDoc(
        doc(db, 'users', user.uid, 'progress', selectedCourseId)
      );
      
      if (progressDoc.exists()) {
        setProgress(progressDoc.data());
      } else {
        // Initialize progress if not exists
        setProgress({
          unlockedModuleOrder: 1,
          completedModules: {}
        });
      }
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModuleStatus = (module) => {
    if (!progress || !progress.completedModules) return 'video';
    
    const moduleProgress = progress.completedModules[module.id];
    if (!moduleProgress) return 'video';
    
    if (moduleProgress.mcqPassed) return 'completed';
    if (moduleProgress.videoCompleted) return 'mcq';
    return 'video';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (courses.length === 0) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Courses Available</h2>
          <p className="text-gray-600">Please contact your administrator to set up courses.</p>
        </div>
      </Layout>
    );
  }

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
        <p className="text-gray-600">Continue your learning journey</p>
      </div>

      {selectedCourse && (
        <div className="mb-8 card">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedCourse.title}</h2>
          <p className="text-gray-600">{selectedCourse.description}</p>
          
          {progress && (
            <div className="mt-4 flex items-center gap-4">
              <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">
                <span className="text-sm font-medium text-primary-700">
                  Current Module: {progress.unlockedModuleOrder} of {modules.length}
                </span>
              </div>
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

      {modules.length === 0 && (
        <div className="text-center py-12 card">
          <p className="text-gray-600">No modules available yet.</p>
        </div>
      )}
    </Layout>
  );
};
