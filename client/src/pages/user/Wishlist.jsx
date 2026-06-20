import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchWishlist, removeFromWishlist } from '../../store/slices/wishlistSlice';
import { addToCart } from '../../store/slices/cartSlice';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice, formatDiscount, classNames } from '../../lib/helpers';
import wishlistService from '../../services/wishlistService';

const WishlistCard = ({ item, onRemove, onAddToCart }) => {
  const product = item.product || {};
  const productId = typeof product === 'object' ? product._id : product;
  const title = item.title || product.title || '';
  const image = item.image || product.images?.[0]?.url || '';
  const sellingPrice = item.price || product.pricing?.sellingPrice || 0;
  const originalPrice = product.pricing?.originalPrice || 0;
  const discount = formatDiscount(originalPrice, sellingPrice);
  const slug = product.slug || productId;
  const [priceAlert, setPriceAlert] = useState(item.priceAlert || false);
  const [addingToCart, setAddingToCart] = useState(false);

  const handleTogglePriceAlert = async () => {
    try {
      await wishlistService.setPriceAlert(productId);
      setPriceAlert(!priceAlert);
    } catch {
      // silently fail
    }
  };

  const handleAddToCart = () => {
    setAddingToCart(true);
    const sellerId = product.seller?._id || (typeof product.seller === 'string' ? product.seller : null);
    onAddToCart({
      product: productId,
      title,
      price: sellingPrice,
      image,
      quantity: 1,
      seller: sellerId,
    });
    setTimeout(() => setAddingToCart(false), 1500);
  };

  return (
    <Card className="flex flex-col h-full group">
      <Link to={`/products/${slug}`} className="block">
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
          {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {discount > 0 && (
            <Badge variant="danger" size="xs" className="absolute top-2 left-2">{discount}% OFF</Badge>
          )}
        </div>
      </Link>

      <div className="flex-1 flex flex-col">
        <Link to={`/products/${slug}`} className="block">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors mb-1">
            {title}
          </h3>
        </Link>

        {product.seller?.name && (
          <p className="text-xs text-gray-500 mb-2">by {product.seller.name}</p>
        )}

        <div className="flex items-center gap-2 mb-3">
          <span className="text-base font-bold text-gray-900">{formatPrice(sellingPrice)}</span>
          {originalPrice > sellingPrice && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(originalPrice)}</span>
          )}
        </div>

        <div className="mt-auto space-y-2">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={handleAddToCart}
            isLoading={addingToCart}
          >
            {addingToCart ? 'Adding...' : 'Add to Cart'}
          </Button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePriceAlert}
              className={classNames(
                'flex items-center gap-1.5 text-xs transition-colors',
                priceAlert ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <svg className="w-3.5 h-3.5" fill={priceAlert ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Price alert {priceAlert ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => onRemove(productId)}
              className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove from wishlist"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default function Wishlist() {
  const dispatch = useDispatch();
  const { items, isLoading } = useSelector(state => state.wishlist);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const handleRemove = (productId) => {
    dispatch(removeFromWishlist(productId));
  };

  const handleAddToCart = (item) => {
    dispatch(addToCart(item));
  };

  const wishlistProducts = items.filter(item => {
    const p = item.product || {};
    return p && typeof p !== 'string' ? p.status === 'published' || !p.status : true;
  });

  return (
    <>
      <Helmet><title>My Wishlist | Zalnio</title></Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-500 mt-1">{items.length} {items.length === 1 ? 'item' : 'items'} saved</p>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-20 h-20 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Save your favorite products to buy later</p>
            <Link to="/products">
              <Button variant="primary" size="lg">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {wishlistProducts.map((item, idx) => {
              const productId = typeof item.product === 'object' ? item.product._id : item.product;
              return (
                <WishlistCard
                  key={productId || idx}
                  item={item}
                  onRemove={handleRemove}
                  onAddToCart={handleAddToCart}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
