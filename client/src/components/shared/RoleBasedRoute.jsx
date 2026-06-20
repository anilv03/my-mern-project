// TODO: Remove — dead code
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectAuth } from '../../store/slices/authSlice';
import { PageLoader } from '../ui/Loader';

const RoleBasedRoute = ({ children, roles, fallbackPath = '/' }) => {
  const { user, isAuthenticated, isLoading } = useSelector(selectAuth);

  if (isLoading) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default RoleBasedRoute;
