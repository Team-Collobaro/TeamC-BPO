import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/learner/dashboard', label: 'Dashboard' },
  { to: '/learner/library', label: 'Knowledge Library' },
  { to: '/learner/assessment', label: 'Final Questionnaire' },
  { to: '/learner/results', label: 'Results & Certificate' },
  { to: '/learner/profile', label: 'My Profile' },
  { to: '/learner/internship', label: 'Internship' },
  { to: '/learner/reactivate', label: 'Reactivation' },
  { to: '/learner/payments', label: 'Payments' }
];

export const LearnerLayout = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h1 className="text-lg font-bold text-primary-600">UK BPO Learning</h1>
          <p className="text-xs text-gray-500 mt-1">Learner</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="mt-2 text-sm text-gray-600 hover:text-gray-900 w-full text-left"
          >
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>
    </div>
  );
};
