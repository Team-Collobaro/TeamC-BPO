import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/courses', label: 'Courses & Library' },
  { to: '/admin/questionnaires', label: 'Questionnaire Builder' },
  { to: '/admin/pricing', label: 'Pricing & Plans' },
  { to: '/admin/payments', label: 'Payments & Refunds' },
  { to: '/admin/subscriptions', label: 'Employer Subscriptions' },
  { to: '/admin/visibility', label: 'Candidate Visibility' },
  { to: '/admin/internships', label: 'Internship Applications' },
  { to: '/admin/surveys', label: 'Surveys & Automations' },
  { to: '/admin/emails', label: 'Email Templates' },
  { to: '/admin/audit', label: 'Audit Logs' },
  { to: '/admin/settings', label: 'Settings' }
];

export const AdminLayout = ({ children }) => {
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
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-lg font-bold text-primary-400">UK BPO Admin</h1>
          <p className="text-xs text-gray-400 mt-1">Back Office</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="mt-2 text-sm text-gray-400 hover:text-white"
          >
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>
    </div>
  );
};
