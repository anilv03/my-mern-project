import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { subscribeNewsletter, resetNewsletterSuccess } from '../../store/slices/newsletterSlice';
import Button from '../ui/Button';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NewsletterSection = () => {
  const dispatch = useDispatch();
  const { isLoading, isSuccess, isError, message } = useSelector(state => state.newsletter);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isSuccess) {
      setEmail('');
      setTimeout(() => dispatch(resetNewsletterSuccess()), 3000);
    }
  }, [isSuccess, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    dispatch(subscribeNewsletter({ email, source: 'homepage' }));
  };

  const successMessage = 'Thank you for subscribing! Stay tuned for updates.';
  const displayMsg = isSuccess ? successMessage : (isError ? (message || 'Something went wrong.') : '');

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white rounded-full translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="relative max-w-xl mx-auto px-6 py-14 md:py-20 text-center">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
          Stay in the Loop
        </h2>
        <p className="text-primary-100 text-sm md:text-base mb-8">
          Get the latest updates on new courses, flash sales, and exclusive offers delivered to your inbox.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
            placeholder="Enter your email"
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg border-0 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-300 text-sm disabled:opacity-60"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            disabled={isLoading}
            className="bg-white !text-primary-700 hover:!bg-gray-100 whitespace-nowrap"
          >
            Subscribe
          </Button>
        </form>

        {error && (
          <p className="mt-3 text-sm text-red-300">{error}</p>
        )}
        {displayMsg && !error && (
          <p className={`mt-3 text-sm ${isSuccess ? 'text-green-300' : 'text-red-300'}`}>
            {displayMsg}
          </p>
        )}
      </div>
    </section>
  );
};

export default NewsletterSection;
