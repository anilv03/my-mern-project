import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { sellerRegister, reset } from '../../store/slices/authSlice';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const SellerRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, isError, isSuccess, message, user } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated && user?.role === 'seller') {
      navigate('/seller/kyc', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    return () => dispatch(reset());
  }, [dispatch]);

  useEffect(() => {
    if (isError && typeof message === 'string') {
      const fieldMap = { name: 'name', email: 'email', phone: 'phone', password: 'password' };
      for (const [key] of Object.entries(fieldMap)) {
        if (message.toLowerCase().includes(key) || message.toLowerCase().includes('phone')) {
          setErrors(prev => ({ ...prev, [key]: message }));
          break;
        }
      }
    }
  }, [isError, message]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!formData.name || formData.name.length < 2) errs.name = 'Name is required (min 2 chars)';
    if (!formData.email) errs.email = 'Email is required';
    if (!formData.phone) errs.phone = 'Phone is required';
    else if (!/^[+]?[\d\s()-]{10,15}$/.test(formData.phone)) errs.phone = 'Enter valid phone (10-15 digits, e.g. +919876543210)';
    if (!formData.password || formData.password.length < 8) errs.password = 'Min 8 characters, uppercase, lowercase, number';
    else if (!/[A-Z]/.test(formData.password)) errs.password = 'Must contain an uppercase letter';
    else if (!/[a-z]/.test(formData.password)) errs.password = 'Must contain a lowercase letter';
    else if (!/[0-9]/.test(formData.password)) errs.password = 'Must contain a number';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(sellerRegister({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    }));
  };

  return (
    <>
      <Helmet><title>Become a Seller | Zalnio</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-accent-50 via-white to-primary-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-display font-bold text-gray-900">Become a Seller</h1>
              <p className="text-gray-500 mt-1">Start selling on Zalnio</p>
            </div>

            {isError && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{message}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full Name" type="text" name="name" placeholder="Your legal name" value={formData.name} onChange={handleChange} error={errors.name} />
              <Input label="Email" type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} error={errors.email} />
              <Input label="Phone Number" type="tel" name="phone" placeholder="+91 98765 43210" value={formData.phone} onChange={handleChange} error={errors.phone} />
              <Input label="Password" type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} error={errors.password} helperText="Min 8 chars, uppercase, lowercase, number" />
              <Input label="Confirm Password" type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                By registering, you agree to complete KYC verification (PAN, Selfie, etc.) before accessing the seller dashboard.
              </div>

              <Button type="submit" fullWidth isLoading={isLoading} className="!bg-accent-600 hover:!bg-accent-700">
                Register as Seller
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already a seller?{' '}
              <Link to="/auth/login" className="text-accent-600 font-medium hover:underline">Sign in</Link>
            </p>
            <p className="text-center text-sm text-gray-500 mt-2">
              Want to buy?{' '}
              <Link to="/auth/register" className="text-primary-600 font-medium hover:underline">Create a customer account</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SellerRegister;
