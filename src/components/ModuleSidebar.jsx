import { Link } from 'react-router-dom';

export const ModuleSidebar = ({ modules, courseId, currentModuleId, unlockedModuleOrder, progress }) => {
  const completedModules = progress?.completedModules || {};

  const isModuleFullyCompleted = (moduleId) => {
    const p = completedModules[moduleId];
    return !!(p?.videoCompleted && p?.mcqPassed);
  };

  const isLocked = (module) => {
    if (module.order > unlockedModuleOrder) return true;
    if (module.order <= 1) return false;
    const prevModule = modules.find((m) => m.order === module.order - 1);
    return prevModule ? !isModuleFullyCompleted(prevModule.id) : false;
  };

  return (
    <div className="bg-white rounded-lg shadow-md flex flex-col sticky top-4 h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h3 className="font-semibold text-gray-900">Course Modules</h3>
      </div>
      
      {/* Scrollable Module List */}
      <div className="flex-1 overflow-y-auto p-4 pt-4 min-h-0">
        <div className="space-y-2">
          {modules.map((module) => {
            const locked = isLocked(module);
            const isCurrent = module.id === currentModuleId;
            
            const ModuleItem = () => (
              <div
                className={`p-3 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-primary-100 border-2 border-primary-500'
                    : locked
                    ? 'bg-gray-50 opacity-60'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-semibold text-gray-400">#{module.order}</span>
                    <span className={`text-sm font-medium ${isCurrent ? 'text-primary-700' : 'text-gray-700'}`}>
                      {module.title}
                    </span>
                  </div>
                  {locked && <span className="text-sm">🔒</span>}
                </div>
              </div>
            );
            
            if (locked) {
              return <div key={module.id}><ModuleItem /></div>;
            }
            
            return (
              <Link key={module.id} to={`/course/${courseId}/module/${module.id}`}>
                <ModuleItem />
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
};
