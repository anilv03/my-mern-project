import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../store/slices/authSlice';
import { PageLoader } from '../ui/Loader';

const ProtectedRoute = ({ roles, redirectTo = '/auth/login' }) => {
  const { user, isAuthenticated, isLoading } = useSelector(selectAuth);
  const location = useLocation();

  if (isLoading && !user) return <PageLoader />;

  if (!isAuthenticated && !isLoading) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    const dashboardMap = {
      admin: '/admin',
      super_admin: '/admin',
      seller: '/seller',
      customer: '/',
    };

    const redirectPath = dashboardMap[user?.role] || '/';
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
