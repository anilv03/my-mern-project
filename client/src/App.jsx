import { Routes, Route, Outlet } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useDispatch } from 'react-redux';
import { loadUser } from './store/slices/authSlice';

import RootLayout from './layouts/RootLayout';
import AuthLayout from './layouts/AuthLayout';
import SellerLayout from './layouts/SellerLayout';
import AdminLayout from './layouts/AdminLayout';
import DashboardLayout from './layouts/DashboardLayout';

import ProtectedRoute from './components/shared/ProtectedRoute';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { PageLoader } from './components/ui/Loader';

import PublicRoutes from './routes/PublicRoutes';
import UserRoutes from './routes/UserRoutes';
import SellerRoutes from './routes/SellerRoutes';
import AdminRoutes from './routes/AdminRoutes';

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const SellerRegister = lazy(() => import('./pages/seller/Register'));

function SuspenseErrorBoundary({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route element={<SuspenseErrorBoundary><Outlet /></SuspenseErrorBoundary>}>
          {PublicRoutes}
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route element={<SuspenseErrorBoundary><Outlet /></SuspenseErrorBoundary>}>
              {UserRoutes}
            </Route>
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['seller', 'admin', 'super_admin']} />}>
          <Route path="seller" element={<SellerLayout />}>
            <Route element={<SuspenseErrorBoundary><Outlet /></SuspenseErrorBoundary>}>
              {SellerRoutes}
            </Route>
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['admin', 'super_admin']} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route element={<SuspenseErrorBoundary><Outlet /></SuspenseErrorBoundary>}>
              {AdminRoutes}
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<SuspenseErrorBoundary><Login /></SuspenseErrorBoundary>} />
        <Route path="register" element={<SuspenseErrorBoundary><Register /></SuspenseErrorBoundary>} />
        <Route path="forgot-password" element={<SuspenseErrorBoundary><ForgotPassword /></SuspenseErrorBoundary>} />
        <Route path="reset-password/:token" element={<SuspenseErrorBoundary><ForgotPassword /></SuspenseErrorBoundary>} />
      </Route>

      <Route path="/auth/seller/register" element={<SuspenseErrorBoundary><SellerRegister /></SuspenseErrorBoundary>} />
    </Routes>
  );
}
