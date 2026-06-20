import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchProductBySlug, clearCurrentProduct } from '../../store/slices/productSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../store/slices/wishlistSlice';
import { checkAccess } from '../../store/slices/subscriptionSlice';
import { getOrCreateChat } from '../../store/slices/chatSlice';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { PageLoader } from '../../components/ui/Loader';
import ReviewSection from '../../components/shared/ReviewSection';
import { DIGITAL_PRODUCTS, PHYSICAL_PRODUCTS } from '../../lib/constants';

const ImageGallery = ({ images, videos }) => {
  const allImages = images?.length > 0 ? images : [{ url: null }];
  const [mode, setMode] = useState('images');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const currentImage = mode === 'images' ? allImages[selectedIndex] : null;
  const currentVideo = mode === 'videos' ? videos[selectedIndex] : null;

  return (
    <div className="space-y-4">
      {mode === 'videos' && currentVideo ? (
        <div className="aspect-square bg-black rounded-2xl overflow-hidden flex items-center justify-center">
          {currentVideo.url ? (
            <video
              src={currentVideo.url}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              className="w-full h-full object-contain"
              poster={currentVideo.thumbnail || undefined}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
          {currentImage?.url ? (
            <img src={currentImage.url} alt="Product" className="w-full h-full object-contain p-4" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300">
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2">
        {videos?.length > 0 && (
          <button
            onClick={() => { setMode('videos'); setSelectedIndex(0); }}
            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors relative ${
              mode === 'videos' ? 'border-primary-500' : 'border-transparent hover:border-gray-300'
            }`}
          >
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{videos.length}</span>
          </button>
        )}
        {allImages.map((img, idx) => (
          <button
            key={idx}
            onClick={() => { setMode('images'); setSelectedIndex(idx); }}
            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
              mode === 'images' && idx === selectedIndex ? 'border-primary-500' : 'border-transparent hover:border-gray-300'
            }`}
          >
            {img?.url ? (
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-100" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentProduct: product, isLoading } = useSelector(state => state.products);
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { items: wishlistItems } = useSelector(state => state.wishlist);
  const { accessMap } = useSelector(state => state.subscriptions);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const productId = product?._id;
  const accessInfo = accessMap[productId] || {};
  const hasAccess = accessInfo.hasAccess;
  const purchased = accessInfo.purchased;
  const subscribed = accessInfo.subscribed;
  const isDigital = DIGITAL_PRODUCTS.includes(product?.productType);
  const isPhysical = PHYSICAL_PRODUCTS.includes(product?.productType);
  const isSubscription = product?.productType === 'subscription';

  useEffect(() => {
    dispatch(fetchProductBySlug(slug));
    return () => dispatch(clearCurrentProduct());
  }, [dispatch, slug]);

  useEffect(() => {
    if (productId && isAuthenticated) {
      dispatch(checkAccess(productId));
    }
  }, [dispatch, productId, isAuthenticated]);

  const handleContactSeller = async () => {
    if (!isAuthenticated) return navigate('/auth/login');
    const sellerId = product.seller?._id || product.seller;
    if (!sellerId) return;
    const result = await dispatch(getOrCreateChat({ sellerId, productId: product._id }));
    if (result.meta.requestStatus === 'fulfilled' && result.payload?._id) {
      navigate(`/messages/${result.payload._id}`);
    }
  };

  if (isLoading || !product) return <PageLoader />;

  const isInWishlist = wishlistItems?.some(item => {
    const id = typeof item.product === 'object' ? item.product?._id : item.product;
    return id === product._id;
  });

  const discount = product.pricing?.originalPrice > product.pricing?.sellingPrice
    ? Math.round(((product.pricing.originalPrice - product.pricing.sellingPrice) / product.pricing.originalPrice) * 100)
    : 0;

  const buildCartPayload = () => {
    const sellerId = product.seller?._id || (typeof product.seller === 'string' ? product.seller : null);
    const payload = {
      product: product._id,
      price: product.pricing?.sellingPrice,
      quantity,
      seller: sellerId,
    };
    if (selectedVariant) {
      payload.variant = selectedVariant._id || selectedVariant;
    }
    return payload;
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    dispatch(addToCart(buildCartPayload()));
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    dispatch(addToCart(buildCartPayload()));
    const isDigital = DIGITAL_PRODUCTS.includes(product.productType);
    navigate(isDigital ? '/checkout/digital' : '/checkout');
  };

  const handleToggleWishlist = () => {
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
    <>
      <Helmet>
        <title>{product.title} | Zalnio</title>
        <meta name="description" content={product.shortDescription || product.description?.slice(0, 160)} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: 'Home', to: '/' },
          { label: 'Products', to: '/products' },
          ...(product.category ? [{ label: typeof product.category === 'object' ? product.category.name : 'Category', to: `/products?category=${product.category._id}` }] : []),
          { label: product.title },
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ImageGallery images={product.images} videos={product.videos} />

          <div>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Badge variant="secondary">{product.productType?.replace(/_/g, ' ')}</Badge>
                <h1 className="text-3xl font-display font-bold text-gray-900">{product.title}</h1>
              </div>
              <button onClick={handleToggleWishlist} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className={`w-6 h-6 ${isInWishlist ? 'text-red-500 fill-current' : 'text-gray-400'}`} fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {product.shortDescription && (
              <p className="text-gray-600 mt-4">{product.shortDescription}</p>
            )}

            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center text-yellow-400">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg key={star} className={`w-5 h-5 ${star <= Math.round(product.ratings?.average || 0) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-sm text-gray-600 ml-2">{product.ratings?.average?.toFixed(1) || '0.0'}</span>
                <span className="text-sm text-gray-400 ml-1">({product.ratings?.count || 0} reviews)</span>
              </div>
            </div>

            {product.seller && (
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                Sold by <span className="font-medium text-gray-700">{product.seller.name}</span>
                {user?._id !== product.seller._id && (
                  <button
                    onClick={handleContactSeller}
                    className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    Contact Seller
                  </button>
                )}
              </p>
            )}

            <div className="flex items-baseline gap-3 mt-6 py-4 border-y">
              <span className="text-4xl font-bold text-gray-900">₹{product.pricing?.sellingPrice?.toLocaleString()}</span>
              {discount > 0 && (
                <>
                  <span className="text-xl text-gray-400 line-through">₹{product.pricing?.originalPrice?.toLocaleString()}</span>
                  <Badge variant="danger" size="md">{discount}% OFF</Badge>
                </>
              )}
            </div>

            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {product.tags.map(tag => (
                  <Badge key={tag} variant="secondary" size="sm">{tag}</Badge>
                ))}
              </div>
            )}

            {product.variants?.length > 0 && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.filter(v => v.isActive).map(variant => (
                    <button
                      key={variant._id || variant.sku}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        selectedVariant?._id === variant._id || selectedVariant?.sku === variant.sku
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {variant.name} - ₹{variant.price?.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="px-4 py-2.5 font-medium text-gray-900 min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>

            {purchased && (
              <div className="mt-4">
                <Badge variant="success" size="md">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Purchased
                </Badge>
              </div>
            )}

            <div className="flex items-center gap-4 mt-6">
              {purchased ? (
                <>
                  {isDigital && product?.productType === 'video_course' && (
                    <Button size="lg" fullWidth onClick={() => navigate(`/my-courses/${productId}`)}>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                      Continue Watching
                    </Button>
                  )}
                  {isDigital && product?.productType === 'audiobook' && (
                    <Button size="lg" fullWidth onClick={() => navigate(`/my-audiobooks/${productId}`)}>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                      Listen Again
                    </Button>
                  )}
                  {isDigital && product?.productType !== 'video_course' && product?.productType !== 'audiobook' && (
                    <Button size="lg" fullWidth onClick={() => navigate(`/my-library`)}>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      View in Library
                    </Button>
                  )}
                  {isPhysical && (
                    <>
                      <Link to={`/orders?search=${productId}`} className="flex-1">
                        <Button size="lg" fullWidth variant="outline">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Track Order
                        </Button>
                      </Link>
                      <Button size="lg" variant="primary" onClick={handleAddToCart}>
                        {addedToCart ? 'Added!' : 'Buy Again'}
                      </Button>
                    </>
                  )}
                  {isSubscription && !subscribed && (
                    <Button size="lg" fullWidth variant="primary" onClick={handleAddToCart}>
                      Subscribe Now
                    </Button>
                  )}
                  {isSubscription && subscribed && (
                    <Link to="/my-subscription" className="flex-1">
                      <Button size="lg" fullWidth variant="primary">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Manage Subscription
                      </Button>
                    </Link>
                  )}
                </>
              ) : hasAccess && isSubscription && subscribed ? (
                <Link to="/my-subscription" className="flex-1">
                  <Button size="lg" fullWidth variant="primary">
                    Manage Subscription
                  </Button>
                </Link>
              ) : (
                <>
                  <Button size="lg" fullWidth onClick={handleAddToCart}>
                    {addedToCart ? 'Added!' : 'Add to Cart'}
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleBuyNow}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Buy Now
                  </Button>
                </>
              )}
            </div>

            <div className="mt-8 space-y-4">
              {product.settings?.isDownloadable && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Instant Download
                </div>
              )}
              {product.settings?.requiresShipping && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Free Shipping on orders above ₹499
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Secure Payment
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <div className="prose max-w-none text-gray-600 whitespace-pre-wrap">{product.description}</div>
            </Card>

            {product.physicalDetails && (
              <Card className="mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Details</h2>
                <dl className="grid grid-cols-2 gap-4">
                  {product.physicalDetails.isbn && (
                    <>
                      <dt className="text-sm text-gray-500">ISBN</dt>
                      <dd className="text-sm text-gray-900">{product.physicalDetails.isbn}</dd>
                    </>
                  )}
                  {product.physicalDetails.publisher && (
                    <>
                      <dt className="text-sm text-gray-500">Publisher</dt>
                      <dd className="text-sm text-gray-900">{product.physicalDetails.publisher}</dd>
                    </>
                  )}
                  {product.physicalDetails.language && (
                    <>
                      <dt className="text-sm text-gray-500">Language</dt>
                      <dd className="text-sm text-gray-900">{product.physicalDetails.language}</dd>
                    </>
                  )}
                  {product.physicalDetails.pageCount && (
                    <>
                      <dt className="text-sm text-gray-500">Pages</dt>
                      <dd className="text-sm text-gray-900">{product.physicalDetails.pageCount}</dd>
                    </>
                  )}
                  {product.physicalDetails.edition && (
                    <>
                      <dt className="text-sm text-gray-500">Edition</dt>
                      <dd className="text-sm text-gray-900">{product.physicalDetails.edition}</dd>
                    </>
                  )}
                </dl>
              </Card>
            )}

            {hasAccess && product.digitalFile?.courseVideos?.length > 0 && (
              <Card className="mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Content</h2>
                <div className="space-y-3">
                  {product.digitalFile.courseVideos
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((video, idx) => (
                      <div key={video._id || idx} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{video.title || `Lesson ${idx + 1}`}</p>
                          {video.duration && (
                            <p className="text-sm text-gray-500">{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</p>
                          )}
                        </div>
                        <video
                          src={video.url}
                          controls
                          controlsList="nodownload"
                          disablePictureInPicture
                          className="w-40 h-24 rounded-lg object-cover bg-black flex-shrink-0"
                          poster={video.thumbnail || undefined}
                        />
                      </div>
                    ))}
                </div>
              </Card>
            )}

            <ReviewSection
              productId={product._id}
              initialReviews={product.reviews || []}
              ratings={product.ratings}
            />

          </div>

          <div className="space-y-6">
            {product.seller && (
              <Card className="overflow-hidden">
                {product.seller.sellerProfile?.storeBanner?.url && (
                  <div className="h-24 -mx-4 -mt-4 mb-0 overflow-hidden">
                    <img src={product.seller.sellerProfile.storeBanner.url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`flex items-center gap-3 ${product.seller.sellerProfile?.storeBanner?.url ? '-mt-12 relative z-10' : ''}`}>
                  {product.seller.sellerProfile?.storeLogo?.url ? (
                    <img src={product.seller.sellerProfile.storeLogo.url} alt="" className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-sm" />
                  ) : product.seller.avatar?.url ? (
                    <img src={product.seller.avatar.url} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center border-2 border-white shadow-sm">
                      <span className="text-primary-600 font-semibold text-lg">{product.seller.name?.[0]}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{product.seller.sellerProfile?.storeName || product.seller.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {product.seller.sellerStatus === 'approved' && (
                        <Badge variant="success" size="xs">Verified Seller</Badge>
                      )}
                      {product.seller.sellerProfile?.rating > 0 && (
                        <span className="text-xs text-gray-500 flex items-center gap-0.5">
                          <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          {product.seller.sellerProfile.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {product.seller.sellerProfile?.storeDescription && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">{product.seller.sellerProfile.storeDescription}</p>
                )}
                <div className="mt-3 space-y-1.5">
                  {product.seller.sellerProfile?.contactEmail && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      <span>{product.seller.sellerProfile.contactEmail}</span>
                    </div>
                  )}
                  {product.seller.sellerProfile?.contactPhone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      <span>{product.seller.sellerProfile.contactPhone}</span>
                    </div>
                  )}
                  {product.seller.sellerProfile?.totalProducts > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      <span>{product.seller.sellerProfile.totalProducts} Products</span>
                    </div>
                  )}
                  {product.seller.createdAt && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span>Member since {new Date(product.seller.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
                <Link
                  to={`/products?seller=${product.seller._id}`}
                  className="block text-center mt-4 pt-3 border-t text-sm text-primary-600 hover:underline font-medium"
                >
                  View all products by this seller
                </Link>
              </Card>
            )}

            {(product.settings || product.productType || product.digitalFile?.duration || product.physicalDetails?.condition) && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Features</h3>
                  <Badge variant="secondary">{product.productType?.replace(/_/g, ' ')}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {product.settings?.isDownloadable && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 rounded-lg px-3 py-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      Downloadable
                    </div>
                  )}
                  {product.settings?.hasSample && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-lg px-3 py-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      Free Sample
                    </div>
                  )}
                  {product.settings?.isBundle && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-purple-50 rounded-lg px-3 py-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                      Bundle Offer
                    </div>
                  )}
                  {product.settings?.isSubscription && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-orange-50 rounded-lg px-3 py-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                      Subscription
                    </div>
                  )}
                  {product.settings?.ageRestriction > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-red-50 rounded-lg px-3 py-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                      Age {product.settings.ageRestriction}+
                    </div>
                  )}
                  {product.physicalDetails?.condition && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-yellow-50 rounded-lg px-3 py-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
                      {product.physicalDetails.condition.replace(/_/g, ' ')}
                    </div>
                  )}
                  {product.digitalFile?.duration && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-cyan-50 rounded-lg px-3 py-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0" />
                      {Math.floor(product.digitalFile.duration / 60)} min
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
