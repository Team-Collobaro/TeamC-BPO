import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminLayout } from '../../components/AdminLayout';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    users: 0,
    usersByRole: {},
    paymentsMtd: 0,
    paymentsMtdCount: 0,
    activeCandidates: 0,
    internshipsPending: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [usersSnap, paymentsSnap, candidatesSnap, internshipsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(query(collection(db, 'payments'), where('status', '==', 'succeeded'))),
          getDocs(query(collection(db, 'candidate_profiles'), where('visibleToEmployers', '==', true))),
          getDocs(query(collection(db, 'internship_applications'), where('status', '==', 'pending')))
        ]);

        const users = usersSnap.docs.map((d) => d.data());
        const byRole = {};
        users.forEach((u) => {
          const r = u.role || 'learner';
          byRole[r] = (byRole[r] || 0) + 1;
        });

        let paymentsMtd = 0;
        let paymentsMtdCount = 0;
        paymentsSnap.docs.forEach((d) => {
          const data = d.data();
          const created = data.completedAt?.toDate?.() || data.createdAt?.toDate?.();
          if (created && created >= startOfMonth) {
            paymentsMtd += data.amount || 0;
            paymentsMtdCount += 1;
          }
        });

        setStats({
          users: users.length,
          usersByRole: byRole,
          paymentsMtd,
          paymentsMtdCount,
          activeCandidates: candidatesSnap.size,
          internshipsPending: internshipsSnap.size
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">Users</p>
          <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
          <p className="text-xs text-gray-500 mt-1">
            {['learner', 'candidate', 'employer', 'admin'].map((r) => (
              <span key={r} className="mr-2">{r}: {stats.usersByRole[r] ?? 0}</span>
            ))}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Payments (MTD)</p>
          <p className="text-2xl font-bold text-gray-900">£{(stats.paymentsMtd / 100).toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.paymentsMtdCount} transactions</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Active candidates</p>
          <p className="text-2xl font-bold text-gray-900">{stats.activeCandidates}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Internships pending</p>
          <p className="text-2xl font-bold text-gray-900">{stats.internshipsPending}</p>
        </div>
      </div>
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Quick links</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link to="/admin/users" className="text-primary-600 hover:underline">User management</Link>
          <span className="text-gray-400">•</span>
          <Link to="/admin/courses" className="text-primary-600 hover:underline">Courses & Library</Link>
          <span className="text-gray-400">•</span>
          <Link to="/admin/pricing" className="text-primary-600 hover:underline">Pricing</Link>
          <span className="text-gray-400">•</span>
          <Link to="/admin/payments" className="text-primary-600 hover:underline">Payments</Link>
          <span className="text-gray-400">•</span>
          <Link to="/admin/internships" className="text-primary-600 hover:underline">Internships</Link>
          <span className="text-gray-400">•</span>
          <Link to="/admin/audit" className="text-primary-600 hover:underline">Audit logs</Link>
        </div>
      </div>
    </AdminLayout>
  );
};
