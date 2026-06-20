import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { forgotPassword, resetPassword, reset } from '../../store/slices/authSlice';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token: resetToken } = useParams();
  const { isLoading, isError, isSuccess, message } = useSelector(state => state.auth);

  const [email, setEmail] = useState('');
  const [step, setStep] = useState(resetToken ? 'reset' : 'email');
  const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    return () => dispatch(reset());
  }, [dispatch]);

  const handleSendResetLink = (e) => {
    e.preventDefault();
    if (!email) { setErrors({ email: 'Email is required' }); return; }
    dispatch(forgotPassword(email)).then((res) => {
      if (!res.error) setStep('sent');
    });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    const errs = {};
    if (!passwordData.password || passwordData.password.length < 8) errs.password = 'Min 8 characters';
    if (passwordData.password !== passwordData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    dispatch(resetPassword({ token: resetToken, ...passwordData })).then((res) => {
      if (!res.error) setStep('done');
    });
  };

  if (step === 'sent') {
    return (
      <>
        <Helmet><title>Check Email | Zalnio</title></Helmet>
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-display font-bold text-gray-900 mb-2">Check Your Email</h1>
          <p className="text-gray-500 mb-6">We've sent a password reset link to <strong>{email}</strong></p>
          <Link to="/auth/login" className="btn-primary inline-block">Back to Sign In</Link>
        </div>
      </>
    );
  }

  if (step === 'done') {
    return (
      <>
        <Helmet><title>Password Reset | Zalnio</title></Helmet>
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-display font-bold text-gray-900 mb-2">Password Reset Successfully</h1>
          <p className="text-gray-500 mb-6">You can now sign in with your new password.</p>
          <Link to="/auth/login" className="btn-primary inline-block">Sign In</Link>
        </div>
      </>
    );
  }

  if (step === 'reset') {
    return (
      <>
        <Helmet><title>Reset Password | Zalnio</title></Helmet>
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold text-gray-900">Reset Password</h1>
            <p className="text-gray-500 mt-1">Enter your new password</p>
          </div>

          {isError && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{message}</div>}
          {isSuccess && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm mb-4">Password changed!</div>}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input label="New Password" type="password" placeholder="••••••••" value={passwordData.password} onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })} error={errors.password} />
            <Input label="Confirm Password" type="password" placeholder="••••••••" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} error={errors.confirmPassword} />
            <Button type="submit" fullWidth isLoading={isLoading}>Reset Password</Button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Forgot Password | Zalnio</title></Helmet>
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-bold text-gray-900">Forgot Password?</h1>
          <p className="text-gray-500 mt-1">Enter your email and we'll send you a reset link</p>
        </div>

        {isError && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{message}</div>}

        <form onSubmit={handleSendResetLink} className="space-y-4">
          <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setErrors({}); }} error={errors.email} />
          <Button type="submit" fullWidth isLoading={isLoading}>Send Reset Link</Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Remember your password?{' '}
          <Link to="/auth/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </>
  );
};

export default ForgotPassword;
