import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { login, reset, sendEmailOtp, verifyEmailOtp, sendPhoneOtp, verifyPhoneOtp } from '../../store/slices/authSlice';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, isError, message, otpSent, otpVerified } = useSelector(state => state.auth);

  const [loginMethod, setLoginMethod] = useState('email');
  const [formData, setFormData] = useState({ email: '', phone: '', password: '' });
  const [otpForm, setOtpForm] = useState({ otp: '' });
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState('login');
  const [errors, setErrors] = useState({});

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    return () => dispatch(reset());
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (loginMethod === 'email' && !formData.email) errs.email = 'Email is required';
    if (loginMethod === 'phone' && !formData.phone) errs.phone = 'Phone is required';
    if (!formData.password && !showOtpInput) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (showOtpInput) {
      if (loginMethod === 'email') {
        dispatch(verifyEmailOtp({ email: formData.email, otp: otpForm.otp }));
      } else {
        dispatch(verifyPhoneOtp({ phone: formData.phone, otp: otpForm.otp }));
      }
      return;
    }

    const credentials = loginMethod === 'email'
      ? { email: formData.email, password: formData.password }
      : { phone: formData.phone, password: formData.password };

    dispatch(login(credentials));
  };

  const handleSendOtp = () => {
    if (loginMethod === 'email') {
      dispatch(sendEmailOtp({ email: formData.email, purpose: 'login' }));
    } else {
      dispatch(sendPhoneOtp({ phone: formData.phone, purpose: 'login' }));
    }
    setShowOtpInput(true);
  };

  const switchMethod = () => {
    setLoginMethod(prev => prev === 'email' ? 'phone' : 'email');
    setShowOtpInput(false);
    setOtpForm({ otp: '' });
    setErrors({});
  };

  return (
    <>
      <Helmet><title>Sign In | Zalnio</title></Helmet>
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {isError && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{message}</div>
        )}

        {otpVerified && (
          <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm mb-4">OTP verified successfully</div>
        )}

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setLoginMethod('email'); setShowOtpInput(false); setErrors({}); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${loginMethod === 'email' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Email
          </button>
          <button
            onClick={() => { setLoginMethod('phone'); setShowOtpInput(false); setErrors({}); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${loginMethod === 'phone' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Phone
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loginMethod === 'email' ? (
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />
          ) : (
            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
            />
          )}

          {!showOtpInput && (
            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />
          )}

          {showOtpInput && (
            <div className="space-y-3">
              <Input
                label="Enter OTP"
                type="text"
                name="otp"
                placeholder="6-digit OTP"
                maxLength={6}
                value={otpForm.otp}
                onChange={(e) => setOtpForm({ otp: e.target.value })}
              />
              <button type="button" onClick={handleSendOtp} className="text-sm text-primary-600 hover:underline">
                Resend OTP
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            {showOtpInput ? (
              <button type="button" onClick={() => setShowOtpInput(false)} className="text-gray-500 hover:text-gray-700">
                Back to password login
              </button>
            ) : (
              <button type="button" onClick={handleSendOtp} className="text-primary-600 hover:underline">
                Login with OTP instead
              </button>
            )}
            <Link to="/auth/forgot-password" className="text-primary-600 hover:underline">Forgot password?</Link>
          </div>

          <Button type="submit" fullWidth isLoading={isLoading}>
            {showOtpInput ? 'Verify OTP' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/auth/register" className="text-primary-600 font-medium hover:underline">Create one</Link>
        </p>

        <div className="mt-4 text-center">
          <Link to="/auth/seller/register" className="text-sm text-accent-600 hover:underline">
            Sell on Zalnio — Register as Seller
          </Link>
        </div>
      </div>
    </>
  );
};

export default Login;
