import { Link } from 'react-router-dom';

export const ModuleCard = ({ module, courseId, isLocked, status }) => {
  const getStatusBadge = () => {
    if (isLocked) {
      return <span className="px-3 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">🔒 Locked</span>;
    }
    
    switch (status) {
      case 'completed':
        return <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">✓ Completed</span>;
      case 'mcq':
        return <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">📝 Take MCQ</span>;
      case 'video':
        return <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">▶ Watch Video</span>;
      default:
        return <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">Pending</span>;
    }
  };

  const CardContent = () => (
    <div className={`card hover:shadow-lg transition-shadow ${isLocked ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-gray-300">#{module.order}</span>
            <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
          </div>
          {module.description && (
            <p className="text-sm text-gray-600">{module.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          {isLocked && <span className="text-2xl">🔒</span>}
        </div>
      </div>
    </div>
  );

  if (isLocked) {
    return <CardContent />;
  }

  return (
    <Link to={`/course/${courseId}/module/${module.id}`}>
      <CardContent />
    </Link>
  );
};
