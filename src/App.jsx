import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleGuard } from './components/RoleGuard';
import { ROLES } from './lib/firebase';

import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';
import { RedirectByRole } from './pages/RedirectByRole';

import { DashboardPage } from './pages/DashboardPage';
import { ModulePage } from './pages/ModulePage';

import { LearnerDashboardPage } from './pages/learner/LearnerDashboardPage';
import { LearnerLibraryPage } from './pages/learner/LearnerLibraryPage';
import { AssessmentDisclaimerPage } from './pages/learner/AssessmentDisclaimerPage';
import { AssessmentStartPage } from './pages/learner/AssessmentStartPage';
import { AssessmentResultsPage } from './pages/learner/AssessmentResultsPage';
import { CertificateViewPage } from './pages/learner/CertificateViewPage';
import { CoursePurchasePage } from './pages/learner/CoursePurchasePage';
import { PaymentSuccessPage } from './pages/learner/PaymentSuccessPage';
import { ReactivationPage } from './pages/learner/ReactivationPage';
import { LearnerInternshipPage } from './pages/learner/LearnerInternshipPage';
import { SurveyRespondPage } from './pages/SurveyRespondPage';
import { CandidateDashboardPage } from './pages/candidate/CandidateDashboardPage';
import { CandidateProfilePage } from './pages/candidate/CandidateProfilePage';
import { CandidateJoiningFeePage } from './pages/candidate/CandidateJoiningFeePage';
import { EmployerDashboardPage } from './pages/employer/EmployerDashboardPage';
import { EmployerSubscriptionPage } from './pages/employer/EmployerSubscriptionPage';
import { EmployerCandidatesPage } from './pages/employer/EmployerCandidatesPage';
import { EmployerCandidateDetailPage } from './pages/employer/EmployerCandidateDetailPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCoursesPage } from './pages/admin/AdminCoursesPage';
import { AdminQuestionnaireBuilderPage } from './pages/admin/AdminQuestionnaireBuilderPage';
import { AdminPricingPage } from './pages/admin/AdminPricingPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminInternshipsPage } from './pages/admin/AdminInternshipsPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/survey/respond" element={<SurveyRespondPage />} />

          {/* Legacy dashboard redirect */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RedirectByRole />
              </ProtectedRoute>
            }
          />

          {/* Learner */}
          <Route
            path="/learner/dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.LEARNER]}>
                  <LearnerDashboardPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/library"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.LEARNER]}>
                  <LearnerLibraryPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/assessment/disclaimer"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.LEARNER]}>
                  <AssessmentDisclaimerPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/assessment/start"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.LEARNER]}>
                  <AssessmentStartPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/assessment/results"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.LEARNER]}>
                  <AssessmentResultsPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/course/:courseId/purchase"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.LEARNER]}>
                  <CoursePurchasePage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/payment-success"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.LEARNER]}>
                  <PaymentSuccessPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/certificate/:certId"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.LEARNER]}>
                  <CertificateViewPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/reactivate"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.LEARNER]}>
                  <ReactivationPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/internship"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.LEARNER]}>
                  <LearnerInternshipPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/*"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.LEARNER]}>
                  <LearnerDashboardPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Candidate */}
          <Route
            path="/candidate/dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.CANDIDATE]}>
                  <CandidateDashboardPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/joining-fee"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.CANDIDATE]}>
                  <CandidateJoiningFeePage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/profile"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.CANDIDATE]}>
                  <CandidateProfilePage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/reactivate"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.CANDIDATE]}>
                  <ReactivationPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/*"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.CANDIDATE]}>
                  <CandidateDashboardPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Employer */}
          <Route
            path="/employer/dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.EMPLOYER]}>
                  <EmployerDashboardPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/subscription"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.EMPLOYER]}>
                  <EmployerSubscriptionPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/candidates"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.EMPLOYER]}>
                  <EmployerCandidatesPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/candidates/:candidateId"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.EMPLOYER]}>
                  <EmployerCandidateDetailPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/*"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.EMPLOYER]}>
                  <EmployerDashboardPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.ADMIN]}>
                  <AdminDashboardPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.ADMIN]}>
                  <AdminUsersPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.ADMIN]}>
                  <AdminCoursesPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questionnaires"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.ADMIN]}>
                  <AdminQuestionnaireBuilderPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pricing"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.ADMIN]}>
                  <AdminPricingPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.ADMIN]}>
                  <AdminPaymentsPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/internships"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.ADMIN]}>
                  <AdminInternshipsPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.ADMIN]}>
                  <AdminAuditPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={[ROLES.ADMIN]}>
                  <AdminDashboardPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Legacy course routes (learner flow - keep for existing MVP) */}
          <Route
            path="/course/:courseId/module/:moduleId"
            element={
              <ProtectedRoute>
                <ModulePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
