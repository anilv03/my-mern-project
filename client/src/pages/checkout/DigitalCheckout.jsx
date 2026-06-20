import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchCart, calculateTotals } from '../../store/slices/cartSlice';
import { createOrder, verifyPayment, resetOrderSuccess } from '../../store/slices/orderSlice';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice, classNames } from '../../lib/helpers';
import paymentService from '../../services/paymentService';

const PAYMENT_METHODS = [
  { value: 'razorpay', label: 'Razorpay', icon: 'https://img.icons8.com/color/48/000000/razorpay.png' },
  { value: 'stripe', label: 'Stripe', icon: 'https://img.icons8.com/color/48/000000/stripe.png' },
  { value: 'wallet', label: 'Wallet', icon: null },
];

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function DigitalCheckout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, discount, total, isLoading: cartLoading } = useSelector(state => state.cart);
  const { isLoading: orderLoading, currentOrder, isError, message } = useSelector(state => state.orders);
  const { user } = useSelector(state => state.auth);

  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  useEffect(() => {
    dispatch(calculateTotals());
  }, [dispatch, items]);

  const handleRazorpayPayment = useCallback(async (order, amount) => {
    try {
      const razorpayOrder = await paymentService.createRazorpayOrder({
        orderId: order._id,
        amount,
        currency: 'INR',
      });

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setErrorMsg('Failed to load payment gateway. Please try again.');
        setProcessing(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: import.meta.env.VITE_APP_NAME || 'Zalnio',
        description: `Order #${order.orderNumber || order._id?.slice(-8)}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#7C3AED' },
        handler: async (response) => {
          try {
            await dispatch(verifyPayment({
              orderId: order._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })).unwrap();
            dispatch(resetOrderSuccess());
            navigate(`/order-success/${order._id}`);
          } catch {
            setErrorMsg('Payment verification failed. Please contact support.');
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            setErrorMsg('Payment cancelled. You can retry when ready.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Failed to initiate payment');
      setProcessing(false);
    }
  }, [user, navigate, dispatch]);

  useEffect(() => {
    if (currentOrder && processing) {
      const amount = currentOrder.pricing?.total || total;
      if (paymentMethod === 'razorpay') {
        handleRazorpayPayment(currentOrder, amount);
      } else if (paymentMethod === 'wallet') {
        dispatch(resetOrderSuccess());
        navigate(`/order-success/${currentOrder._id}`);
      } else {
        dispatch(resetOrderSuccess());
        navigate(`/order-success/${currentOrder._id}`);
      }
    }
  }, [currentOrder, processing]);

  const handlePlaceOrder = async () => {
    setErrorMsg('');
    setProcessing(true);
    dispatch(createOrder({
      paymentMethod,
      notes: notes.trim() || undefined,
    }));
  };

  if (cartLoading && items.length === 0) return <PageLoader />;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Add some digital products before checking out.</p>
              <Button onClick={() => navigate('/products')}>Browse Products</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Digital Checkout | Zalnio</title></Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Digital Checkout</h1>
        <p className="text-gray-500 mb-8">No shipping needed — instant access after payment.</p>

        {(isError || errorMsg) && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {errorMsg || message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Items</h2>
              </CardHeader>
              <CardBody>
                <div className="divide-y">
                  {items.map((item, idx) => {
                    const product = item.product || {};
                    const title = item.title || product.title || '';
                    const image = item.image || product.images?.[0]?.url || '';
                    const productId = typeof product === 'object' ? product._id : product;
                    const productType = product.productType || item.productType || '';

                    return (
                      <div key={productId || idx} className="flex items-center gap-4 py-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {image ? (
                            <img src={image} alt={title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" size="xs">{productType.replace(/_/g, ' ')}</Badge>
                            <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(method => (
                    <label
                      key={method.value}
                      className={classNames(
                        'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors hover:border-gray-300',
                        paymentMethod === method.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                      )}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={() => setPaymentMethod(method.value)}
                        disabled={processing}
                        className="border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      {method.icon ? (
                        <img src={method.icon} alt={method.label} className="w-8 h-8 object-contain" />
                      ) : (
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{method.label}</p>
                        <p className="text-xs text-gray-500">
                          {method.value === 'wallet' ? `Balance: ${formatPrice(user?.wallet?.balance || 0)}` : 'Secure online payment'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Order Notes</h2>
              </CardHeader>
              <CardBody>
                <Input
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions (optional)..."
                  disabled={processing}
                />
              </CardBody>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="sticky top-24">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Items ({items.length})</span>
                    <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span className="font-medium">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium text-green-600">FREE</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-base font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Instant access after payment
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secure payment
                  </div>
                </div>
              </CardBody>
              <CardFooter>
                <Button
                  fullWidth
                  size="lg"
                  onClick={handlePlaceOrder}
                  isLoading={orderLoading || processing}
                  disabled={orderLoading || processing}
                >
                  {processing ? 'Processing...' : `Pay ${formatPrice(total)}`}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
