import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { register, reset, verifyEmailOtp } from '../../store/slices/authSlice';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, isError, isSuccess, message, otpSent, otpVerified } = useSelector(state => state.auth);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated && !otpSent) navigate('/', { replace: true });
  }, [isAuthenticated, navigate, otpSent]);

  useEffect(() => {
    return () => dispatch(reset());
  }, [dispatch]);

  useEffect(() => {
    if (otpVerified) {
      navigate('/', { replace: true });
    }
  }, [otpVerified, navigate]);

  useEffect(() => {
    if (isError && typeof message === 'string' && message.includes('Password')) {
      setErrors(prev => ({ ...prev, password: message }));
    }
  }, [isError, message]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validateStep1 = () => {
    const errs = {};
    if (!formData.name || formData.name.length < 2) errs.name = 'Name must be at least 2 characters';
    if (!formData.email) errs.email = 'Email is required';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(formData.password)) errs.password = 'Must contain an uppercase letter';
    else if (!/[a-z]/.test(formData.password)) errs.password = 'Must contain a lowercase letter';
    else if (!/[0-9]/.test(formData.password)) errs.password = 'Must contain a number';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!validateStep1()) return;
    dispatch(register({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      password: formData.password,
    }));
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    dispatch(verifyEmailOtp({ email: formData.email, otp }));
  };

  if (otpSent && !otpVerified) {
    return (
      <>
        <Helmet><title>Verify Email | Zalnio</title></Helmet>
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold text-gray-900">Verify Email</h1>
            <p className="text-gray-500 mt-1">Enter the 6-digit OTP sent to {formData.email}</p>
          </div>

          {isError && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{message}</div>}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <Input
              label="OTP"
              type="text"
              placeholder="6-digit OTP"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <Button type="submit" fullWidth isLoading={isLoading}>Verify OTP</Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Didn't receive it?{' '}
            <button onClick={handleRegister} className="text-primary-600 hover:underline font-medium">Resend OTP</button>
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Create Account | Zalnio</title></Helmet>
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-1">Join Zalnio today</p>
        </div>

        {isError && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{message}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <Input label="Full Name" type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} error={errors.name} />
          <Input label="Email" type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} error={errors.email} />
          <Input label="Phone (optional)" type="tel" name="phone" placeholder="+91 98765 43210" value={formData.phone} onChange={handleChange} />
          <Input label="Password" type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} error={errors.password} helperText="Min 8 chars, uppercase, lowercase, number" />
          <Input label="Confirm Password" type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />

          <Button type="submit" fullWidth isLoading={isLoading}>Create Account</Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
        </p>

        <div className="mt-4 pt-4 border-t text-center">
          <Link to="/auth/seller/register" className="text-sm text-accent-600 hover:underline font-medium">
            Want to sell? Register as a Seller
          </Link>
        </div>
      </div>
    </>
  );
};

export default Register;
