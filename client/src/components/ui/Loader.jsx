import { useState, useEffect } from 'react';
import { classNames } from '../../lib/helpers';

const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12', xl: 'h-16 w-16' };

  return (
    <svg
      className={classNames('animate-spin text-primary-600', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
};

const PageLoader = ({ message = 'Loading...', delay = 200 }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return <div className="min-h-[400px]" />;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Spinner size="xl" />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
};

const Skeleton = ({ className = '', variant = 'text' }) => {
  const variants = {
    text: 'h-4 w-full rounded',
    title: 'h-6 w-3/4 rounded',
    avatar: 'h-12 w-12 rounded-full',
    card: 'h-48 rounded-xl',
    image: 'h-64 rounded-lg',
    button: 'h-10 w-24 rounded-lg',
  };

  return (
    <div
      className={classNames(
        'animate-pulse bg-gray-200',
        variants[variant] || variants.text,
        className
      )}
    />
  );
};

const ProductCardSkeleton = () => (
  <div className="card p-0 overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-5 bg-gray-200 rounded w-1/3" />
    </div>
  </div>
);

export { Spinner, PageLoader, Skeleton, ProductCardSkeleton };
export default Spinner;
