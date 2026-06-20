import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectAuth } from '../../store/slices/authSlice';
import { logout } from '../../store/slices/authSlice';
import { selectNotifications } from '../../store/slices/notificationSlice';
import { selectCart, fetchCart } from '../../store/slices/cartSlice';
import { setFilters, resetFilters } from '../../store/slices/productSlice';
import { APP_NAME } from '../../lib/constants';
import { formatPrice, getInitials } from '../../lib/helpers';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isAuthenticated } = useSelector(selectAuth);
  const { unreadCount } = useSelector(selectNotifications);
  const cart = useSelector(selectCart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [isAuthenticated, dispatch]);

  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  const navLinks = [
    { path: '/search', label: 'Browse' },
    { path: '/categories', label: 'Categories' },
    { path: '/products?type=ebook', label: 'eBooks' },
    { path: '/products?type=video_course', label: 'Courses' },
    { path: '/products?type=new_book', label: 'Books' },
    { path: '/subscriptions', label: 'Subscriptions' },
    { path: '/blog', label: 'Blog' },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold text-primary-600">
            {APP_NAME}
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => {
              const [path, queryString] = link.path.split('?');
              const handleClick = () => {
                if (queryString) {
                  const params = new URLSearchParams(queryString);
                  const filterParams = {};
                  for (const [key, value] of params.entries()) {
                    const reduxKey = key === 'type' ? 'productType' : key;
                    filterParams[reduxKey] = value;
                  }
                  dispatch(setFilters(filterParams));
                } else {
                  dispatch(resetFilters());
                }
                navigate(path);
              };
              return (
                <button key={link.path} onClick={handleClick} className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
                  {link.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/search')} aria-label="Search" className="p-2 text-gray-500 hover:text-primary-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {isAuthenticated && (
              <button onClick={() => navigate('/messages')} aria-label="Messages" className="relative p-2 text-gray-500 hover:text-primary-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            )}

            <button onClick={() => navigate(isAuthenticated ? '/cart' : '/auth/login')} aria-label="Shopping cart" className="relative p-2 text-gray-500 hover:text-primary-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {cart.items.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.items.length}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {user?.avatar?.url ? (
                      <img src={user.avatar.url} alt={`${user?.name || 'User'}'s avatar`} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      getInitials(user?.name)
                    )}
                  </div>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 animate-slide-down">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsProfileOpen(false)}>Profile</Link>
                    <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsProfileOpen(false)}>Orders</Link>
                    <Link to="/my-learning" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsProfileOpen(false)}>My Learning</Link>
                    <Link to="/wishlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsProfileOpen(false)}>Wishlist</Link>
                    <hr className="my-1" />
                    <button onClick={() => { dispatch(logout()); setIsProfileOpen(false); navigate('/'); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth/login" className="btn-primary text-sm !px-4 !py-2">Sign In</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
