import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchCart, updateCartItem, removeFromCart, applyCoupon, clearCart, removeCoupon, calculateTotals } from '../../store/slices/cartSlice';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import { formatPrice, classNames } from '../../lib/helpers';
import { DIGITAL_PRODUCTS } from '../../lib/constants';

const CartItemSkeleton = () => (
  <div className="flex items-center gap-4 p-4 animate-pulse">
    <div className="w-5 h-5 bg-gray-200 rounded flex-shrink-0" />
    <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/4" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
    </div>
    <div className="w-28 h-10 bg-gray-200 rounded-lg" />
    <div className="w-20 h-5 bg-gray-200 rounded" />
    <div className="w-8 h-8 bg-gray-200 rounded" />
  </div>
);

const CartItem = ({ item, selected, onToggleSelect, onUpdateQuantity, onRemove }) => {
  const product = item.product || {};
  const productId = typeof product === 'object' ? product._id : product;
  const title = item.title || product.title || '';
  const image = item.image || product.images?.[0]?.url || '';
  const sellerName = typeof item.seller === 'object' ? item.seller?.name : (item.seller || product.seller?.name || '');
  const unitPrice = item.price || product.pricing?.sellingPrice || 0;
  const isDigital = DIGITAL_PRODUCTS.includes(product.productType);
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    setRemoving(true);
    onRemove(productId);
  };

  return (
    <div className={classNames(
      'flex items-center gap-3 md:gap-4 p-4 md:p-5 border-b border-gray-100 last:border-0 transition-all duration-200 group',
      selected ? 'bg-primary-50/30' : 'hover:bg-gray-50/50',
      removing && 'opacity-50 pointer-events-none'
    )}>
      <label className="flex-shrink-0 flex items-center justify-center w-5 h-5 cursor-pointer">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(productId)}
          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
        />
      </label>

      <Link to={`/products/${product.slug || productId}`} className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-xl overflow-hidden ring-1 ring-gray-100 relative">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {isDigital && (
          <div className="absolute top-1 left-1">
            <Badge variant="primary" size="xs">Digital</Badge>
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          to={`/products/${product.slug || productId}`}
          className="text-sm font-medium text-gray-900 hover:text-primary-600 line-clamp-1 transition-colors"
        >
          {title}
        </Link>
        {sellerName && (
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {sellerName}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm font-semibold text-gray-900">{formatPrice(unitPrice)}</span>
          <span className="text-xs text-gray-400">/ each</span>
        </div>
      </div>

      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0">
        <button
          onClick={() => onUpdateQuantity(productId, Math.max(1, item.quantity - 1))}
          disabled={item.quantity <= 1}
          className="px-2.5 md:px-3 py-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="px-3 py-2 font-semibold text-gray-900 min-w-[2.5rem] text-center text-sm border-x border-gray-200 bg-white">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQuantity(productId, item.quantity + 1)}
          className="px-2.5 md:px-3 py-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      <div className="text-right min-w-[80px] md:min-w-[90px] flex-shrink-0">
        <p className="text-sm md:text-base font-bold text-gray-900">{formatPrice(unitPrice * item.quantity)}</p>
        {item.quantity > 1 && (
          <p className="text-[11px] text-gray-400 mt-0.5">{formatPrice(unitPrice)} each</p>
        )}
      </div>

      <button
        onClick={handleRemove}
        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
        title="Remove item"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};

const EmptyCart = () => (
  <div className="text-center py-20 md:py-28">
    <div className="w-28 h-28 mx-auto mb-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center">
      <svg className="w-14 h-14 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
    <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
      Looks like you haven&apos;t added anything to your cart yet. Browse our collection and find something you love!
    </p>
    <Link to="/products">
      <Button variant="primary" size="lg">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Browse Products
      </Button>
    </Link>
  </div>
);

const CouponSection = ({ coupon, discount, couponCode, setCouponCode, couponError, handleApplyCoupon, handleRemoveCoupon }) => (
  <div className="mt-4 pt-4 border-t border-gray-100">
    {coupon ? (
      <div className="flex items-center justify-between bg-green-50 rounded-lg px-4 py-3 border border-green-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">{coupon.code}</p>
            <p className="text-xs text-green-600">Discount applied</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-green-700">-{formatPrice(discount)}</span>
          <button onClick={handleRemoveCoupon} className="p-1.5 hover:bg-green-200 rounded-full transition-colors">
            <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    ) : (
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Have a coupon code?</label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
              error={couponError}
              className="text-sm pr-20"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleApplyCoupon} className="flex-shrink-0 px-5">
            Apply
          </Button>
        </div>
        {couponError && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {couponError}
          </p>
        )}
      </div>
    )}
  </div>
);

const OrderSummary = ({ items, subtotal, discount, shipping, tax, total, coupon, couponCode, setCouponCode, couponError, handleApplyCoupon, handleRemoveCoupon }) => {
  const allDigital = items.every(item => {
    const type = item.product?.productType || item.productType || '';
    return DIGITAL_PRODUCTS.includes(type);
  });
  const checkoutPath = allDigital ? '/checkout/digital' : '/checkout';
  const totalSavings = items.reduce((sum, item) => {
    const original = item.product?.pricing?.originalPrice || 0;
    const selling = item.price || 0;
    return sum + (original - selling) * item.quantity;
  }, 0);

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Order Summary
        </h3>
      </CardHeader>

      <CardBody>
        <div className="space-y-3.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
            <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
          </div>

          {totalSavings > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">You save</span>
              <span className="font-medium text-green-600">{formatPrice(totalSavings)}</span>
            </div>
          )}

          {coupon && (
            <div className="flex justify-between items-center bg-green-50/50 -mx-6 px-6 py-2.5 border-y border-green-100">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-sm font-medium text-green-800">{coupon.code}</span>
              </div>
              <span className="text-sm font-bold text-green-700">-{formatPrice(discount)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            <span className={classNames(
              'font-medium',
              shipping === 0 ? 'text-green-600' : 'text-gray-900'
            )}>
              {shipping === 0 ? (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  FREE
                </span>
              ) : formatPrice(shipping)}
            </span>
          </div>

          {tax > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium text-gray-900">{formatPrice(tax)}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t-2 border-gray-100">
          <div className="flex justify-between items-baseline">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <div className="text-right">
              <span className="text-xl font-bold text-gray-900">{formatPrice(total)}</span>
              {discount > 0 && (
                <p className="text-xs text-green-600 mt-0.5">Including {formatPrice(discount)} discount</p>
              )}
            </div>
          </div>
        </div>
      </CardBody>

      <CardFooter>
        <CouponSection
          coupon={coupon}
          discount={discount}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          couponError={couponError}
          handleApplyCoupon={handleApplyCoupon}
          handleRemoveCoupon={handleRemoveCoupon}
        />

        <Link to={checkoutPath} className="block mt-5">
          <Button fullWidth size="lg">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16V4m0 0L13 8m4-4l4 4M5 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Proceed to Checkout
          </Button>
        </Link>

        <Link
          to="/products"
          className="block text-center mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors"
        >
          Continue Shopping
        </Link>
      </CardFooter>
    </Card>
  );
};

export default function Cart() {
  const dispatch = useDispatch();
  const { items, coupon, subtotal, discount, shipping, tax, total, isLoading } = useSelector(state => state.cart);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  useEffect(() => {
    dispatch(calculateTotals());
  }, [dispatch, items, coupon]);

  useEffect(() => {
    setSelectedIds(prev => prev.filter(id => items.some(item => {
      const pid = typeof item.product === 'object' ? item.product._id : item.product;
      return pid === id;
    })));
  }, [items]);

  const handleToggleSelect = useCallback((productId) => {
    setSelectedIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => {
        return typeof item.product === 'object' ? item.product._id : item.product;
      }));
    }
  }, [items, selectedIds.length]);

  const handleBulkRemove = () => {
    selectedIds.forEach(id => dispatch(removeFromCart(id)));
    setSelectedIds([]);
  };

  const handleUpdateQuantity = (productId, quantity) => {
    dispatch(updateCartItem({ productId, quantity }));
  };

  const handleRemoveItem = (productId) => {
    dispatch(removeFromCart(productId));
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    setCouponError('');
    dispatch(applyCoupon(couponCode));
    setCouponCode('');
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  const allSelected = items.length > 0 && selectedIds.length === items.length;

  if (isLoading && items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse mb-8">
          <div className="h-8 bg-gray-200 rounded-lg w-64 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              {[1, 2, 3].map(i => <CartItemSkeleton key={i} />)}
            </Card>
          </div>
          <div>
            <Card>
              <div className="space-y-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-40" />
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-4 bg-gray-200 rounded w-16" />
                  </div>
                ))}
                <div className="h-10 bg-gray-200 rounded-lg mt-4" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Shopping Cart | Zalnio</title></Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">Shopping Cart</h1>
              <span className="px-2.5 py-0.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <nav className="flex items-center gap-2 text-sm text-gray-400">
              <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-600">Cart</span>
            </nav>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Cart
            </button>
          )}
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-primary-50/80 border border-primary-100 rounded-xl px-5 py-3 mb-4">
            <span className="text-sm font-medium text-primary-700">
              {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'} selected
            </span>
            <Button variant="danger" size="sm" onClick={handleBulkRemove}>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Selected
            </Button>
          </div>
        )}

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Card padding={false}>
                <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3.5 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider items-center">
                  <div className="col-span-1 flex items-center">
                    <label className="flex items-center justify-center w-5 h-5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                    </label>
                  </div>
                  <div className="col-span-4">Product</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                  <div className="col-span-1" />
                </div>
                <div>
                  {items.map((item, idx) => {
                    const productId = typeof item.product === 'object' ? item.product._id : item.product;
                    return (
                      <CartItem
                        key={productId || idx}
                        item={item}
                        selected={selectedIds.includes(productId)}
                        onToggleSelect={handleToggleSelect}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveItem}
                      />
                    );
                  })}
                </div>
              </Card>

              <div className="flex items-center justify-between text-sm text-gray-500 px-1">
                <span>Showing {items.length} {items.length === 1 ? 'item' : 'items'}</span>
                <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors">
                  Add more items
                </Link>
              </div>
            </div>

            <div className="lg:col-span-1">
              <OrderSummary
                items={items}
                subtotal={subtotal}
                discount={discount}
                shipping={shipping}
                tax={tax}
                total={total}
                coupon={coupon}
                couponCode={couponCode}
                setCouponCode={setCouponCode}
                couponError={couponError}
                handleApplyCoupon={handleApplyCoupon}
                handleRemoveCoupon={handleRemoveCoupon}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
