import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Button from '../ui/Button';
import Card from '../ui/Card';
import reviewService from '../../services/reviewService';

const StarRating = ({ rating, onChange, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={`${sizeClass} ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          <svg className="w-full h-full fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

const RatingBar = ({ label, count, total }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-12 text-right text-gray-600 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-gray-500 tabular-nums flex-shrink-0">{count}</span>
    </div>
  );
};

export default function ReviewSection({ productId, initialReviews, ratings }) {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const [reviews, setReviews] = useState(initialReviews || []);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ rating: 0, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setReviews(initialReviews || []);
  }, [initialReviews]);

  const loadReviews = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = await reviewService.getProductReviews(productId, { page, limit: 5 });
      if (page === 1) {
        setReviews(result.reviews);
      } else {
        setReviews(prev => [...prev, ...result.reviews]);
      }
      setMeta(result.meta);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.rating) { setFormError('Please select a rating'); return; }
    setFormError('');
    setSubmitting(true);
    try {
      const newReview = await reviewService.createReview({
        product: productId,
        rating: form.rating,
        title: form.title.trim(),
        comment: form.comment.trim(),
      });
      setReviews(prev => [newReview, ...prev]);
      setForm({ rating: 0, title: '', comment: '' });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    try {
      const updated = await reviewService.markHelpful(reviewId);
      setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, helpfulCount: updated.helpfulCount, helpfulUsers: updated.helpfulUsers } : r));
    } catch { }
  };

  const hasUserReviewed = reviews.some(r => r.user?._id === user?._id || r.user === user?._id);
  const dist = ratings?.distribution || {};
  const totalRatings = ratings?.count || 0;

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Customer Reviews</h2>
      </div>

      {isAuthenticated && !hasUserReviewed && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Write a Review</h3>
          {formError && (
            <p className="text-sm text-red-600 mb-3">{formError}</p>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Rating *</label>
            <StarRating rating={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
          </div>
          <div className="mb-3">
            <input
              type="text"
              placeholder="Review title (optional)"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="input-field w-full"
              maxLength={200}
            />
          </div>
          <div className="mb-4">
            <textarea
              placeholder="Write your review..."
              value={form.comment}
              onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              className="input-field w-full h-24 resize-none"
              maxLength={2000}
            />
          </div>
          <Button onClick={handleSubmit} isLoading={submitting} disabled={!form.rating || submitting}>
            Submit Review
          </Button>
        </div>
      )}

      {totalRatings > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="text-center flex-shrink-0">
            <div className="text-4xl font-bold text-gray-900">{ratings?.average?.toFixed(1)}</div>
            <StarRating rating={Math.round(ratings?.average || 0)} size="sm" />
            <p className="text-sm text-gray-500 mt-1">{totalRatings} review{totalRatings !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 space-y-1">
            <RatingBar label="5 Star" count={dist[5] || 0} total={totalRatings} />
            <RatingBar label="4 Star" count={dist[4] || 0} total={totalRatings} />
            <RatingBar label="3 Star" count={dist[3] || 0} total={totalRatings} />
            <RatingBar label="2 Star" count={dist[2] || 0} total={totalRatings} />
            <RatingBar label="1 Star" count={dist[1] || 0} total={totalRatings} />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      {reviews.length === 0 && !loading ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <p className="text-gray-500">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map(review => {
            const userId = review.user?._id || review.user;
            const userName = review.user?.name || 'Anonymous';
            const userAvatar = review.user?.avatar?.url;
            return (
              <div key={review._id} className="pb-5 border-b last:border-0">
                <div className="flex items-start gap-3">
                  {userAvatar ? (
                    <img src={userAvatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 font-semibold text-sm">{userName[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{userName}</span>
                      {review.isVerifiedPurchase && (
                        <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium">Verified Purchase</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {review.title && (
                      <p className="font-medium text-gray-800 mt-2">{review.title}</p>
                    )}
                    {review.comment && (
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{review.comment}</p>
                    )}
                    {review.images?.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {review.images.map((img, idx) => (
                          <img key={idx} src={img.url || img} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => handleHelpful(review._id)}
                        className={`text-xs flex items-center gap-1 transition-colors ${review.helpfulUsers?.includes(user?._id) ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        Helpful ({review.helpfulCount || 0})
                      </button>
                    </div>
                    {review.sellerReply && (
                      <div className="mt-3 ml-4 pl-3 border-l-2 border-primary-200">
                        <p className="text-xs font-medium text-primary-700">Seller Response</p>
                        <p className="text-sm text-gray-600 mt-1">{review.sellerReply.comment}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {meta && meta.page < meta.pages && (
        <div className="text-center mt-6">
          <Button variant="outline" size="sm" isLoading={loading} onClick={() => loadReviews(meta.page + 1)}>
            Load More Reviews
          </Button>
        </div>
      )}
    </Card>
  );
}
