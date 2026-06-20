import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchSellerReviews, replyToReview } from '../../store/slices/sellerSlice';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';
import { formatDate, formatPrice, classNames } from '../../lib/helpers';

const ratingFilters = [
  { value: 0, label: 'All' },
  { value: 5, label: '5 Star' },
  { value: 4, label: '4 Star' },
  { value: 3, label: '3 Star' },
  { value: 2, label: '2 Star' },
  { value: 1, label: '1 Star' },
];

const StarRating = ({ rating, size = 'sm' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <svg key={star} className={classNames(sizes[size], star <= rating ? 'text-yellow-400' : 'text-gray-200')} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

const ReviewStats = ({ stats }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
    <Card>
      <CardBody className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats?.average?.toFixed(1) || '0.0'}</p>
        <StarRating rating={Math.round(stats?.average || 0)} size="sm" />
        <p className="text-xs text-gray-500 mt-1">Average Rating</p>
      </CardBody>
    </Card>
    <Card>
      <CardBody className="text-center">
        <p className="text-3xl font-bold text-primary-600">{stats?.total || 0}</p>
        <p className="text-xs text-gray-500 mt-1">Total Reviews</p>
      </CardBody>
    </Card>
    <Card>
      <CardBody className="text-center">
        <p className="text-3xl font-bold text-green-600">{stats?.positive || 0}</p>
        <p className="text-xs text-gray-500 mt-1">Positive (4-5★)</p>
      </CardBody>
    </Card>
    <Card>
      <CardBody className="text-center">
        <p className="text-3xl font-bold text-red-600">{stats?.negative || 0}</p>
        <p className="text-xs text-gray-500 mt-1">Negative (1-2★)</p>
      </CardBody>
    </Card>
  </div>
);

export default function SellerReviews() {
  const dispatch = useDispatch();
  const { reviews, isLoading } = useSelector(state => state.seller);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);

  useEffect(() => {
    dispatch(fetchSellerReviews());
  }, [dispatch]);

  const reviewList = Array.isArray(reviews) ? reviews : reviews?.reviews || [];
  const stats = reviews?.stats || null;

  const filtered = ratingFilter
    ? reviewList.filter(r => Math.floor(r.rating) === ratingFilter)
    : reviewList;

  const handleReply = (review) => {
    setSelectedReview(review);
    setReplyText(review.sellerReply || '');
    setShowReplyModal(true);
  };

  const submitReply = () => {
    if (!selectedReview?._id || !replyText.trim()) return;
    dispatch(replyToReview({ reviewId: selectedReview._id, reply: replyText.trim() }));
    setShowReplyModal(false);
    setReplyText('');
  };

  if (isLoading && reviewList.length === 0) return <PageLoader />;

  return (
    <>
      <Helmet><title>Reviews & Ratings | Seller | Zalnio</title></Helmet>

      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900">Reviews & Ratings</h1>
          <p className="text-gray-500 mt-1">Manage customer feedback on your products</p>
        </div>

        <ReviewStats stats={stats} />

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {ratingFilters.map(f => (
            <button key={f.value} onClick={() => setRatingFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                ratingFilter === f.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Card className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No reviews yet</h3>
            <p className="text-gray-500">Reviews will appear here once customers start reviewing your products</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map(review => (
              <Card key={review._id} padding={false}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                        {review.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{review.user?.name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size="md" />
                  </div>

                  {review.product && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                      <span>Product:</span>
                      <span className="font-medium text-gray-700">{review.product.title || 'N/A'}</span>
                    </div>
                  )}

                  <p className="text-sm text-gray-700 mb-3">{review.comment || review.review}</p>

                  {review.images?.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {review.images.map((img, i) => (
                        <img key={i} src={img.url || img} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}

                  {review.sellerReply && (
                    <div className="ml-6 pl-4 border-l-2 border-primary-200 bg-primary-50/50 rounded-r-lg p-3">
                      <p className="text-xs font-medium text-primary-700 mb-1">Your Reply</p>
                      <p className="text-sm text-gray-700">{review.sellerReply}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                    <Button size="sm" variant="outline" onClick={() => handleReply(review)}>
                      {review.sellerReply ? 'Edit Reply' : 'Reply'}
                    </Button>
                    <Badge variant={review.rating >= 4 ? 'success' : review.rating >= 3 ? 'warning' : 'danger'} size="xs">
                      {review.rating} Star
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showReplyModal} onClose={() => setShowReplyModal(false)} title={selectedReview?.sellerReply ? 'Edit Reply' : 'Reply to Review'} size="lg">
        <div className="space-y-4">
          {selectedReview && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <StarRating rating={selectedReview.rating} size="sm" />
                <span className="text-sm font-medium text-gray-900">{selectedReview.user?.name || 'Anonymous'}</span>
              </div>
              <p className="text-sm text-gray-600">{selectedReview.comment || selectedReview.review}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Reply</label>
            <textarea rows={4} className="input-field w-full" placeholder="Write your reply..." value={replyText} onChange={e => setReplyText(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <Button fullWidth onClick={submitReply} disabled={!replyText.trim()}>
              {selectedReview?.sellerReply ? 'Update Reply' : 'Submit Reply'}
            </Button>
            <Button variant="outline" fullWidth onClick={() => setShowReplyModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
