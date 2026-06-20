import { Link } from 'react-router-dom';
import { classNames } from '../../lib/helpers';
import Card from '../ui/Card';
import { Skeleton } from '../ui/Loader';

const StarRating = ({ rating }) => {
  const stars = Math.round(rating);
  return (
    <span className="text-yellow-400 text-sm">
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </span>
  );
};

const SellerCard = ({ seller }) => {
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seller.storeName || seller._id)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  return (
  <Link to={`/store/${seller.storeSlug}`} className="block group flex-shrink-0 w-[200px]">
    <Card className="text-center hover:shadow-lg hover:border-primary-200 transition-all duration-300 h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-200 group-hover:ring-primary-300 transition-all">
          <img
            src={seller.storeLogo || avatarUrl}
            alt={seller.storeName}
            className="w-full h-full object-cover"
            onError={(e) => { if (e.target.src !== avatarUrl) e.target.src = avatarUrl; }}
          />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
            {seller.storeName}
          </h3>
          {seller.rating > 0 && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <StarRating rating={seller.rating} />
              <span className="text-xs text-gray-400">({seller.rating})</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {seller.totalProducts > 0 && <span>{seller.totalProducts} Products</span>}
          {seller.totalSales > 0 && <span>{seller.totalSales} Sales</span>}
        </div>
      </div>
    </Card>
  </Link>
  );
};

const SellerCardSkeleton = () => (
  <Card className="text-center">
    <div className="flex flex-col items-center gap-3">
      <Skeleton variant="avatar" className="!w-16 !h-16 md:!w-20 md:!h-20" />
      <Skeleton variant="title" className="w-2/3" />
      <Skeleton variant="text" className="w-1/3" />
    </div>
  </Card>
);

const FeaturedSellers = ({ sellers = [], loading = false }) => {
  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden pb-2">
        {Array.from({ length: 4 }).map((_, i) => <SellerCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!sellers.length) {
    return <p className="text-gray-400 text-center py-8">No featured sellers yet.</p>;
  }

  return (
    <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {sellers.map(seller => <SellerCard key={seller._id} seller={seller} />)}
    </div>
  );
};

export default FeaturedSellers;
