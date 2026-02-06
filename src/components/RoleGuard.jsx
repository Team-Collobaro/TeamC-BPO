import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../lib/firebase';

const ROLE_DASHBOARD = {
  [ROLES.LEARNER]: '/learner/dashboard',
  [ROLES.CANDIDATE]: '/candidate/dashboard',
  [ROLES.EMPLOYER]: '/employer/dashboard',
  [ROLES.ADMIN]: '/admin/dashboard'
};

export const RoleGuard = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const hasRole = Array.isArray(allowedRoles) && allowedRoles.includes(user.role);
  if (!hasRole) {
    const redirect = ROLE_DASHBOARD[user.role] || '/dashboard';
    return <Navigate to={redirect} replace />;
  }

  return children;
};
