import { useSelector, useDispatch } from 'react-redux';
import { selectAuth, login, register, logout, updateProfile } from '../store/slices/authSlice';
import { ROLES } from '../lib/constants';

const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);

  const isSeller = auth.user?.role === ROLES.SELLER;
  const isAdmin = auth.user?.role === ROLES.ADMIN;
  const isSuperAdmin = auth.user?.role === ROLES.SUPER_ADMIN;
  const isAdminOrAbove = isAdmin || isSuperAdmin;
  const isSellerOrAbove = isSeller || isAdmin || isSuperAdmin;

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    isError: auth.isError,
    isSuccess: auth.isSuccess,
    message: auth.message,
    isSeller,
    isAdmin,
    isSuperAdmin,
    isAdminOrAbove,
    isSellerOrAbove,
    login: (credentials) => dispatch(login(credentials)),
    register: (userData) => dispatch(register(userData)),
    logout: () => dispatch(logout()),
    updateProfile: (userData) => dispatch(updateProfile(userData)),
  };
};

export default useAuth;
