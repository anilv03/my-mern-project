import { useState, useEffect, useCallback } from 'react';
import { classNames } from '../../lib/helpers';
import { Skeleton } from '../ui/Loader';

const ReviewCard = ({ review }) => {
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(review.user?.name || review._id)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  return (
  <div className="text-center px-4 md:px-12">
    <div className="flex items-center justify-center gap-1 mb-4">
      {[1, 2, 3, 4, 5].map(star => (
        <svg
          key={star}
          className={classNames('w-5 h-5', star <= Math.round(review.rating) ? 'text-yellow-400' : 'text-gray-300')}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    <blockquote className="text-gray-600 text-sm md:text-base leading-relaxed mb-6 italic">
      &ldquo;{review.comment}&rdquo;
    </blockquote>
    <div className="flex items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
        <img
          src={review.user?.avatar || avatarUrl}
          alt={review.user?.name || 'User'}
          className="w-full h-full object-cover"
          onError={(e) => { if (e.target.src !== avatarUrl) e.target.src = avatarUrl; }}
        />
      </div>
      <div className="text-left">
        <p className="font-medium text-gray-900 text-sm">{review.user?.name || 'Anonymous'}</p>
        {review.product?.title && (
          <p className="text-xs text-gray-400">{review.product.title}</p>
        )}
      </div>
    </div>
  </div>
  );
};

const ReviewCarouselSkeleton = () => (
  <div className="text-center px-4 md:px-12">
    <div className="flex justify-center gap-1 mb-4">
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="!w-5 !h-5 rounded" />)}
    </div>
    <div className="space-y-2 mb-6">
      <Skeleton variant="text" className="w-3/4 mx-auto" />
      <Skeleton variant="text" className="w-1/2 mx-auto" />
    </div>
    <div className="flex items-center justify-center gap-3">
      <Skeleton variant="avatar" />
      <div className="space-y-1">
        <Skeleton variant="text" className="w-24" />
        <Skeleton variant="text" className="w-16" />
      </div>
    </div>
  </div>
);

const ReviewCarousel = ({ reviews = [], loading = false }) => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % reviews.length);
  }, [reviews.length]);

  useEffect(() => {
    if (reviews.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [reviews.length, next]);

  if (loading) {
    return (
      <div className="py-8">
        <ReviewCarouselSkeleton />
      </div>
    );
  }

  if (!reviews.length) {
    return <p className="text-gray-400 text-center py-8">No reviews yet.</p>;
  }

  return (
    <div>
      <div className="relative min-h-[200px]">
        {reviews.map((review, index) => (
          <div
            key={review._id}
            className={classNames(
              'transition-opacity duration-500',
              index === current ? 'opacity-100 block' : 'opacity-0 hidden'
            )}
          >
            <ReviewCard review={review} />
          </div>
        ))}
      </div>

      {reviews.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={classNames(
                'w-2 h-2 rounded-full transition-all duration-300',
                index === current ? 'bg-primary-600 w-6' : 'bg-gray-300 hover:bg-gray-400'
              )}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewCarousel;
