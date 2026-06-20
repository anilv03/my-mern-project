import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { addToCart } from '../../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../store/slices/wishlistSlice';
import { fetchHomepageData } from '../../store/slices/publicSlice';
import { APP_NAME } from '../../lib/constants';
import { formatPrice, formatDiscount } from '../../lib/helpers';
import HeroSlider from '../../components/home/HeroSlider';
import ProductSection from '../../components/home/ProductSection';
import FlashSaleBanner from '../../components/home/FlashSaleBanner';
import FeaturedSellers from '../../components/home/FeaturedSellers';
import ReviewCarousel from '../../components/home/ReviewCarousel';
import BlogSection from '../../components/home/BlogSection';
import NewsletterSection from '../../components/home/NewsletterSection';
import LearningCenter from '../../components/home/LearningCenter';
import CategoryGrid from '../../components/home/CategoryGrid';
import AdBanner from '../../components/home/AdBanner';
import Badge from '../../components/ui/Badge';

const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80',
    title: 'Learn, Teach & Earn on Your Terms',
    subtitle: 'Discover thousands of eBooks, courses, and digital products from expert educators worldwide.',
    ctaText: 'Browse Products',
    ctaLink: '/products',
  },
  {
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80',
    title: 'Start Selling Your Knowledge',
    subtitle: 'Turn your expertise into income. Join thousands of successful educators on our platform.',
    ctaText: 'Start Selling',
    ctaLink: '/auth/seller/register',
  },
  {
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&q=80',
    title: 'Limited Time Flash Sales',
    subtitle: 'Grab your favorite courses and eBooks at unbeatable prices. Hurry, offers won\'t last long!',
    ctaText: 'Shop Flash Sales',
    ctaLink: '/products',
  },
];



const ProductGridCard = ({ product }) => {
  const discount = formatDiscount(product.pricing?.originalPrice, product.pricing?.sellingPrice);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wishlistItems = useSelector(state => state.wishlist?.items || []);
  const isInWishlist = wishlistItems.some(item => item.product === product._id || item.product?._id === product._id);
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
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary-100/30 hover:-translate-y-1 transition-all duration-300 h-[320px] flex flex-col">
        <div className="h-[65%] bg-white overflow-hidden relative">
          {product.images?.[0]?.url ? (
            <img
              src={product.images[0].url}
              alt={product.title}
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {discount > 0 && (
            <Badge variant="danger" size="xs" className="absolute top-2 left-2 shadow-md">
              -{discount}%
            </Badge>
          )}
          {product.productType && (
            <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
              {product.productType === 'video_course' ? 'Course' :
               product.productType === 'ebook' ? 'eBook' :
               product.productType === 'audiobook' ? 'Audio' :
               product.productType === 'new_book' ? 'Book' :
               product.productType === 'used_book' ? 'Book' :
               product.productType === 'software' ? 'Software' :
               product.productType === 'template' ? 'Template' :
               product.productType === 'subscription' ? 'Subscription' :
               product.productType === 'course_bundle' ? 'Bundle' :
               product.productType.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        <div className="p-3 md:p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors min-h-[2.5rem]">
            {product.title}
          </h3>

          <div className="flex-1 min-h-[0.5rem]" />

          <div className="flex items-center gap-1 mb-1 min-h-[1.25rem]">
            {product.ratings?.average > 0 ? (
              <>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg
                      key={star}
                      className={`w-3 h-3 ${star <= Math.round(product.ratings.average) ? 'text-yellow-400' : 'text-gray-200'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-[10px] font-medium text-gray-500">{product.ratings.average.toFixed(1)}</span>
                <span className="text-[10px] text-gray-400">({product.ratings.count || product.reviewsCount || 0})</span>
              </>
            ) : (
              <span className="text-[10px] text-gray-300">&nbsp;</span>
            )}
          </div>

          <div className="min-h-[1rem]">
            {product.seller?.name && (
              <p className="text-[11px] text-gray-400 truncate">
                by <span className="text-gray-500 font-medium">{product.seller.name}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-gray-900">
                {formatPrice(product.pricing?.sellingPrice)}
              </span>
              {product.pricing?.originalPrice > product.pricing?.sellingPrice && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.pricing?.originalPrice)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {product.sales?.count > 0 && (
                <span className="text-[10px] text-gray-400 mr-1">
                  {product.sales.count.toLocaleString()} sold
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

const ProductCardSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 h-[320px] animate-pulse">
    <div className="h-[65%] bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-1/4" />
    </div>
  </div>
);

const useInView = (threshold = 0.1) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
};

const SectionTitle = ({ subtitle, children }) => (
  <div className="text-center mb-10 md:mb-12">
    <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-3">
      {children}
    </h2>
    {subtitle && (
      <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    )}
    <div className="mt-4 mx-auto w-16 h-1 bg-gradient-to-r from-primary-500 to-primary-300 rounded-full" />
  </div>
);

const Home = () => {
  const dispatch = useDispatch();
  const {
    featuredProducts,
    bestSellers,
    newArrivals,
    videoCourses,
    allProducts,
    activeSales,
    featuredBlogs,
    featuredSellers,
    featuredReviews,
    categories,
    isLoading,
  } = useSelector(state => state.public);
  const [allProductsRef, allProductsInView] = useInView(0.05);

  useEffect(() => {
    dispatch(fetchHomepageData());
  }, [dispatch]);

  return (
    <>
      <Helmet>
        <title>{APP_NAME} — Learn, Teach & Earn on Your Terms</title>
        <meta name="description" content={`${APP_NAME} is a multi-vendor marketplace for eBooks, courses, digital products, and more.`} />
        <meta property="og:title" content={`${APP_NAME} — Learn, Teach & Earn`} />
        <meta property="og:description" content="Multi-vendor marketplace for eBooks, courses, and digital products." />
        <meta name="keywords" content="eBooks, courses, online learning, digital marketplace" />
        <link rel="canonical" href={window.location.origin} />
      </Helmet>

      {/* Hero Slider */}
      <HeroSlider slides={heroSlides} />

      {/* Featured Products */}
      <section className="bg-gradient-to-b from-gray-50 to-white pb-4">
        <ProductSection
          title="Featured Products"
          products={featuredProducts}
          isLoading={isLoading}
          linkTo="/products?sort=featured"
        />
      </section>

      {/* Flash Sale Banner */}
      {activeSales?.length > 0 && activeSales[0]?.products?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-4">
          <FlashSaleBanner sale={activeSales[0]} />
        </section>
      )}

      {/* Best Sellers */}
      <ProductSection
        title="Best Sellers"
        products={bestSellers}
        isLoading={isLoading}
        linkTo="/products?sort=sales"
      />

      {/* Ads & Offers Banner */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <AdBanner />
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <SectionTitle subtitle="Browse products by category to find exactly what you need.">
          Categories
        </SectionTitle>
        <CategoryGrid categories={categories} loading={isLoading} />
      </section>

      {/* Promo Banner */}
      <section className="max-w-7xl mx-auto px-4 pb-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 right-0 w-56 h-56 bg-white rounded-full translate-x-1/4 translate-y-1/4" />
          </div>
          <div className="relative max-w-7xl mx-auto px-6 py-8 md:py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <p className="text-purple-200 text-sm font-medium uppercase tracking-wider mb-2">
                  Limited Offer
                </p>
                <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
                  Unlock Premium Learning
                </h3>
                <p className="text-purple-100 text-sm md:text-base max-w-lg">
                  Get exclusive access to top-rated courses, eBooks, and resources at unbeatable prices.
                </p>
                <div className="flex items-center gap-4 mt-4 justify-center md:justify-start">
                  <div className="flex items-center gap-1.5 text-white">
                    <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold">4.8/5</span>
                    <span className="text-purple-200 text-xs ml-1">from 12k+ reviews</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-700 font-semibold rounded-xl hover:bg-purple-50 transition-all shadow-lg shadow-black/10 active:scale-95"
                >
                  Explore Now
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  to="/subscriptions"
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  View Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="bg-gradient-to-b from-white to-gray-50 pb-4">
        <ProductSection
          title="New Arrivals"
          products={newArrivals}
          isLoading={isLoading}
          linkTo="/products?sort=newest"
        />
      </section>

      {/* All Products - Full Grid */}
      <section ref={allProductsRef} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
          <SectionTitle subtitle="Browse our complete collection of digital products, courses, eBooks and more.">
            All Products
          </SectionTitle>

          <div
            className={`transition-all duration-700 ${
              allProductsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {isLoading && allProducts.length === 0 ? (
              <div className="flex gap-3 md:gap-4 overflow-hidden pb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-[200px] flex-shrink-0">
                    <ProductCardSkeleton />
                  </div>
                ))}
              </div>
            ) : allProducts.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-semibold text-gray-900">{allProducts.length}</span> products
                  </p>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:border-primary-200 hover:text-primary-600 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                    <Link
                      to="/products"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-all shadow-sm"
                    >
                      View All
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
                <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {allProducts.map((product, index) => (
                    <div
                      key={product._id}
                      className={`snap-start w-[200px] flex-shrink-0 transition-all duration-500 ${
                        allProductsInView
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-8'
                      }`}
                      style={{
                        transitionDelay: allProductsInView ? `${Math.min(index * 40, 1000)}ms` : '0ms',
                      }}
                    >
                      <ProductGridCard product={product} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-gray-400 text-lg">No products available yet.</p>
                <p className="text-gray-300 text-sm mt-1">Check back soon for new arrivals.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Learning Center */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-12">
          <LearningCenter courses={videoCourses} loading={isLoading} />
        </div>
      </section>

      {/* Featured Sellers */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <SectionTitle subtitle="Meet our top-rated educators and content creators.">
          Top Sellers
        </SectionTitle>
        <FeaturedSellers sellers={featuredSellers} loading={isLoading} />
      </section>

      {/* Reviews */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle subtitle="Hear from our community of learners and creators.">
            What Our Users Say
          </SectionTitle>
          <ReviewCarousel reviews={featuredReviews} loading={isLoading} />
        </div>
      </section>

      {/* Blog */}
      {featuredBlogs?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <SectionTitle subtitle="Stay updated with the latest trends, tips and insights.">
            From Our Blog
          </SectionTitle>
          <BlogSection posts={featuredBlogs} />
        </section>
      )}

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-4 pb-4">
        <NewsletterSection />
      </section>

      {/* CTA Banner */}
      <section className="relative overflow-hidden mt-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-800" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-14 md:py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Ready to Start Selling?
          </h2>
          <p className="text-primary-100 text-base md:text-lg mb-8 max-w-xl mx-auto">
            Join thousands of educators and creators earning on {APP_NAME}. Start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth/seller/register"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-all text-base shadow-lg shadow-black/10 hover:shadow-xl active:scale-95"
            >
              Become a Seller
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-base"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
