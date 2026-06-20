import { Link } from 'react-router-dom';
import { classNames } from '../../lib/helpers';
import { Skeleton } from '../ui/Loader';

const CategoryCard = ({ category }) => {
  const avatarUrl = `https://api.dicebear.com/7.x/icons/svg?seed=${encodeURIComponent(category.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  const imgSrc = category.icon || category.image?.url || avatarUrl;
  return (
  <Link
    to={`/products?category=${category.slug}`}
    className="group relative block h-24 sm:h-28 md:h-32 rounded-xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex-shrink-0 w-[160px] sm:w-[180px]"
  >
    {category.image?.url || category.icon ? (
      <img
        src={imgSrc}
        alt={category.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        onError={(e) => { if (e.target.src !== avatarUrl) e.target.src = avatarUrl; }}
      />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 flex items-center justify-center p-6">
        <img src={avatarUrl} alt={category.name} className="w-16 h-16 opacity-80" />
      </div>
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
    <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="absolute bottom-0 left-0 right-0 p-3">
      <h3 className="text-white font-semibold text-sm md:text-base leading-tight group-hover:translate-x-0.5 transition-transform">
        {category.name}
      </h3>
      {category.productCount > 0 && (
        <p className="text-white/70 text-xs mt-0.5">{category.productCount} items</p>
      )}
    </div>
    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </Link>
  );
};

const CategorySkeleton = () => (
  <div className="h-24 sm:h-28 md:h-32 rounded-xl overflow-hidden flex-shrink-0 w-[160px] sm:w-[180px]">
    <Skeleton variant="card" className="w-full h-full" />
  </div>
);

const CategoryGrid = ({ categories = [], loading = false }) => {
  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden pb-2">
        {Array.from({ length: 6 }).map((_, i) => <CategorySkeleton key={i} />)}
      </div>
    );
  }

  if (!categories.length) {
    return (
      <p className="text-gray-400 text-center py-8">No categories found.</p>
    );
  }

  return (
    <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {categories.map(cat => <CategoryCard key={cat._id} category={cat} />)}
    </div>
  );
};

export default CategoryGrid;
