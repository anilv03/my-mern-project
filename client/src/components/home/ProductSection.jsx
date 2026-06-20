import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../store/slices/wishlistSlice';
import { formatPrice, formatDiscount } from '../../lib/helpers';
import Badge from '../ui/Badge';

// --- Configuration Constants ---
const PRODUCT_TYPE_LABELS = {
  video_course: 'Course',
  ebook: 'eBook',
  audiobook: 'Audio',
  new_book: 'Book',
  used_book: 'Book',
  software: 'Software',
  template: 'Template',
  subscription: 'Subscription',
  course_bundle: 'Bundle',
};

const STAR_ARRAY = [1, 2, 3, 4, 5];

// --- Sub-Component: Product Card ---
const ProductCard = ({ product }) => {
  // Safe extraction with optional chaining
  const originalPrice = product?.pricing?.originalPrice;
  const sellingPrice = product?.pricing?.sellingPrice;
  const discount = formatDiscount(originalPrice, sellingPrice);

  const averageRating = product?.ratings?.average || 0;
  const reviewCount = product?.ratings?.count || product?.reviewsCount || 0;
  const salesCount = product?.sales?.count || 0;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wishlistItems = useSelector(state => state.wishlist?.items || []);
  const isInWishlist = wishlistItems.some(item => item.product === product?._id || item.product?._id === product?._id);
  const { isAuthenticated } = useSelector(state => state.auth);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    const sellerId = product.seller?._id || (typeof product.seller === 'string' ? product.seller : null);
    if (!sellerId) return;
    dispatch(addToCart({
      product: product._id,
      title: product.title,
      price: product.pricing?.sellingPrice,
      image: product.images?.[0]?.url,
      quantity: 1,
      seller: sellerId,
    }));
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    if (isInWishlist) {
      dispatch(removeFromWishlist(product._id));
    } else {
      dispatch(addToWishlist(product._id));
    }
  };

  return (
    <Link to={`/products/${product?.slug}`} className="group flex-shrink-0 w-[200px]">
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary-100/30 hover:-translate-y-1 transition-all duration-300 h-[320px] w-[230px] flex flex-col">
        
        {/* Media Section */}
        <div className="h-[65%] bg-white overflow-hidden relative p-1">
          <img
            src={product?.images?.[0]?.url || '/placeholder.png'}
            alt={product?.title || 'Product Image'}
            className="w-full h-[100%] object-contain group-hover:scale-110 transition-transform duration-700 rounded-xl"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {discount > 0 && (
            <Badge variant="danger" size="xs" className="absolute top-2 left-2 shadow-md">
              -{discount}%
            </Badge>
          )}
          
          {product?.productType && (
            <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
              {PRODUCT_TYPE_LABELS[product.productType] || product.productType.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Content Section */}
        <div className="p-3 md:p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors min-h-[2.5rem]">
            {product?.title}
          </h3>

          <div className="flex-1 min-h-[0.5rem]" />

          {/* Ratings */}
          <div className="flex items-center gap-1 mb-1 min-h-[1.25rem]">
            {averageRating > 0 ? (
              <>
                <div className="flex items-center">
                  {STAR_ARRAY.map((star) => (
                    <svg
                      key={star}
                      className={`w-3 h-3 ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-200'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-[10px] font-medium text-gray-500">{averageRating.toFixed(1)}</span>
                <span className="text-[10px] text-gray-400">({reviewCount})</span>
              </>
            ) : (
              <span className="text-[10px] text-gray-300">&nbsp;</span>
            )}
          </div>

          {/* Seller info */}
          <div className="min-h-[1rem]">
            {product?.seller?.name && (
              <p className="text-[11px] text-gray-400 truncate">
                by <span className="text-gray-500 font-medium">{product.seller.name}</span>
              </p>
            )}
          </div>

          {/* Pricing & Sales */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-gray-900">
                {formatPrice(sellingPrice)}
              </span>
              {originalPrice > sellingPrice && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {salesCount > 0 && (
                <span className="text-[10px] text-gray-400 mr-1">
                  {salesCount.toLocaleString()} sold
                </span>
              )}
              <button
                onClick={handleAddToCart}
                className="p-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                title="Add to cart"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </button>
              <button
                onClick={handleToggleWishlist}
                className={`p-1.5 rounded-lg transition-colors ${
                  isInWishlist ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                }`}
                title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <svg className="w-3.5 h-3.5" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
};

// --- Sub-Component: Skeleton Loader ---
const ProductCardSkeleton = () => (
  <div className="flex-shrink-0 w-[200px]">
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 h-[320px] animate-pulse">
      <div className="h-[65%] bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  </div>
);

// --- Main Component: Product Section ---
const ProductSection = ({ title, products = [], linkTo = '', loading = false }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Optimized scroll button handler
  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    
    const offset = 10;
    setCanScrollLeft(el.scrollLeft > offset);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - offset);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    updateScrollButtons(); // Initial check

    return () => el.removeEventListener('scroll', updateScrollButtons);
  }, [products, loading]); // Added loading to dependency array for accurate calculation

  const handleScroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    
    const amount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  };

  const showNav = products.length > 4 && (canScrollLeft || canScrollRight);

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      
      {/* Header Area */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-gray-900">{title}</h2>
          {!loading && products.length > 0 && (
            <p className="text-sm text-gray-400 mt-1">{products.length} items</p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {showNav && (
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                className="p-2 rounded-full border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Scroll left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                className="p-2 rounded-full border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Scroll right"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
          {linkTo && (
            <Link
              to={linkTo}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 border border-primary-200 text-primary-600 font-medium rounded-lg hover:bg-primary-50 hover:border-primary-300 transition-colors text-sm"
            >
              View All
              <svg className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Main Listing Content */}
      {loading ? (
        <div className="flex gap-4 overflow-hidden pb-2">
          {Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length > 0 ? (
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div key={product?._id || product?.slug} className="snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-gray-400">No products available yet.</p>
        </div>
      )}

      {/* Mobile-only View All Button */}
      {linkTo && (
        <div className="mt-6 text-center sm:hidden">
          <Link
            to={linkTo}
            className="inline-flex items-center justify-center px-4 py-2 border border-primary-200 text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors text-sm"
          >
            View All
          </Link>
        </div>
      )}
    </section>
  );
};

export default ProductSection;