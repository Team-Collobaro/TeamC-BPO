import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/employer/dashboard', label: 'Dashboard' },
  { to: '/employer/candidates', label: 'Candidate Pool' },
  { to: '/employer/shortlist', label: 'Shortlist / Pipeline' },
  { to: '/employer/unlocked', label: 'CV Unlocks / Purchases' },
  { to: '/employer/subscription', label: 'Subscription & Billing' },
  { to: '/employer/notifications', label: 'Notifications' }
];

export const EmployerLayout = ({ children }) => {
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
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-primary-600">UK BPO Learning</h1>
          <p className="text-xs text-gray-500 mt-1">Employer</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
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
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="mt-2 text-sm text-gray-600 hover:text-gray-900"
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
