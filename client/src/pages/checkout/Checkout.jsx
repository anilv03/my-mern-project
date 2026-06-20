import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchCart, calculateTotals } from '../../store/slices/cartSlice';
import { placeOrder, resetOrderSuccess } from '../../store/slices/orderSlice';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice, classNames } from '../../lib/helpers';
import { PHYSICAL_PRODUCTS } from '../../lib/constants';
import paymentService from '../../services/paymentService';

const PAYMENT_METHODS = [
  { value: 'razorpay', label: 'Razorpay', icon: 'https://img.icons8.com/color/48/000000/razorpay.png' },
  { value: 'stripe', label: 'Stripe', icon: 'https://img.icons8.com/color/48/000000/stripe.png' },
  { value: 'cod', label: 'Cash on Delivery', icon: null },
];

const initialAddress = {
  fullName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zip: '',
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, discount, shipping, tax, total, isLoading: cartLoading } = useSelector(state => state.cart);
  const { isLoading: orderLoading, currentOrder, isError, message } = useSelector(state => state.orders);
  const { user } = useSelector(state => state.auth);

  const [step, setStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState(initialAddress);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [useNewAddress, setUseNewAddress] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const hasPhysicalItems = items.some(item => {
    const product = item.product || {};
    const type = product.productType || item.productType || '';
    return PHYSICAL_PRODUCTS.includes(type);
  });

  const isCODDisabled = total >= 5000 || !hasPhysicalItems;

  useEffect(() => {
    dispatch(fetchCart());
    if (user?.addresses?.length > 0) {
      setSavedAddresses(user.addresses);
    }
  }, [dispatch, user]);

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
            await paymentService.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
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
      } else {
        dispatch(resetOrderSuccess());
        navigate(`/order-success/${currentOrder._id}`);
      }
    }
  }, [currentOrder, processing]);

  const validateAddress = () => {
    const errs = {};
    if (!shippingAddress.fullName.trim()) errs.fullName = 'Full name is required';
    if (!shippingAddress.phone.trim()) errs.phone = 'Phone is required';
    else if (!/^[+]?[\d\s()-]{10,15}$/.test(shippingAddress.phone)) errs.phone = 'Invalid phone number';
    if (!shippingAddress.street.trim()) errs.street = 'Street address is required';
    if (!shippingAddress.city.trim()) errs.city = 'City is required';
    if (!shippingAddress.state.trim()) errs.state = 'State is required';
    if (!shippingAddress.zip.trim()) errs.zip = 'ZIP code is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddressSelect = (address) => {
    setSelectedAddressId(address._id);
    setShippingAddress({
      fullName: address.fullName || '',
      phone: address.phone || '',
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      zip: address.zip || '',
    });
  };

  const handleAddressChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (useNewAddress && !validateAddress()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePlaceOrder = () => {
    setErrorMsg('');
    setProcessing(true);
    dispatch(placeOrder({
      shippingAddress: useNewAddress ? shippingAddress : { _id: selectedAddressId, ...shippingAddress },
      paymentMethod,
      notes: notes.trim() || undefined,
      items: items.map(item => ({
        product: typeof item.product === 'object' ? item.product._id : item.product,
        quantity: item.quantity,
        price: item.price,
      })),
    }));
  };

  if (cartLoading && items.length === 0) return <PageLoader />;

  return (
    <>
      <Helmet><title>Checkout | Zalnio</title></Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="flex items-center gap-4 mb-8 overflow-x-auto scrollbar-hide">
          {[{ num: 1, label: 'Shipping' }, { num: 2, label: 'Review' }, { num: 3, label: 'Payment' }].map((s, i) => (
            <div key={s.num} className="flex items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className={classNames(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                  step >= s.num ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                )}>
                  {step > s.num ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s.num}
                </span>
                <span className={classNames('text-sm font-medium', step >= s.num ? 'text-gray-900' : 'text-gray-500')}>
                  {s.label}
                </span>
              </div>
              {i < 2 && <div className="h-px w-8 sm:w-12 bg-gray-200" />}
            </div>
          ))}
        </div>

        {(isError || errorMsg) && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {errorMsg || message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>

                {savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="useNewAddress"
                        checked={useNewAddress}
                        onChange={() => setUseNewAddress(!useNewAddress)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="useNewAddress" className="text-sm text-gray-700">Use a new address</label>
                    </div>

                    {!useNewAddress && (
                      <div className="space-y-3">
                        {savedAddresses.map(addr => (
                          <label
                            key={addr._id}
                            className={classNames(
                              'flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors',
                              selectedAddressId === addr._id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                            )}
                          >
                            <input
                              type="radio"
                              name="savedAddress"
                              checked={selectedAddressId === addr._id}
                              onChange={() => handleAddressSelect(addr)}
                              className="mt-0.5 border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <div className="text-sm text-gray-700">
                              <p className="font-medium text-gray-900">{addr.fullName}</p>
                              <p>{addr.street}, {addr.city}, {addr.state} - {addr.zip}</p>
                              <p className="text-gray-500">{addr.phone}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {useNewAddress && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Full Name" name="fullName" value={shippingAddress.fullName} onChange={handleAddressChange} error={errors.fullName} placeholder="John Doe" />
                    <Input label="Phone" name="phone" value={shippingAddress.phone} onChange={handleAddressChange} error={errors.phone} placeholder="+91 98765 43210" />
                    <div className="sm:col-span-2">
                      <Input label="Street Address" name="street" value={shippingAddress.street} onChange={handleAddressChange} error={errors.street} placeholder="123 Main St, Apt 4B" />
                    </div>
                    <Input label="City" name="city" value={shippingAddress.city} onChange={handleAddressChange} error={errors.city} placeholder="Mumbai" />
                    <Input label="State" name="state" value={shippingAddress.state} onChange={handleAddressChange} error={errors.state} placeholder="Maharashtra" />
                    <Input label="ZIP Code" name="zip" value={shippingAddress.zip} onChange={handleAddressChange} error={errors.zip} placeholder="400001" />
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <Button onClick={handleNextStep}>Continue to Review</Button>
                </div>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Order</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Shipping To</h3>
                    <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-gray-900">{shippingAddress.fullName}</p>
                      <p>{shippingAddress.street}</p>
                      <p>{shippingAddress.city}, {shippingAddress.state} - {shippingAddress.zip}</p>
                      <p>{shippingAddress.phone}</p>
                    </div>
                    <button onClick={() => setStep(1)} className="text-sm text-primary-600 hover:underline mt-1">Edit</button>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Items ({items.length})</h3>
                    <div className="space-y-3">
                      {items.map((item, idx) => {
                        const product = item.product || {};
                        const title = item.title || product.title || '';
                        const image = item.image || product.images?.[0]?.url || '';
                        const productId = typeof product === 'object' ? product._id : product;
                        return (
                          <div key={productId || idx} className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {image ? (
                                <img src={image} alt={title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Input
                      label="Order Notes (optional)"
                      name="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special instructions..."
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={handleNextStep}>Continue to Payment</Button>
                </div>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>

                <div className="space-y-3">
                  {PAYMENT_METHODS.map(method => {
                    const disabled = method.value === 'cod' && isCODDisabled;
                    return (
                      <label
                        key={method.value}
                        className={classNames(
                          'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors',
                          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300',
                          paymentMethod === method.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                        )}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={paymentMethod === method.value}
                          onChange={() => setPaymentMethod(method.value)}
                          disabled={disabled || processing}
                          className="border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        {method.icon ? (
                          <img src={method.icon} alt={method.label} className="w-8 h-8 object-contain" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{method.label}</p>
                          {method.value === 'cod' && hasPhysicalItems && (
                            <p className="text-xs text-gray-500">Pay with cash on delivery</p>
                          )}
                          {method.value === 'cod' && !hasPhysicalItems && (
                            <p className="text-xs text-amber-600">COD is only available for physical products</p>
                          )}
                          {method.value === 'cod' && total >= 5000 && (
                            <p className="text-xs text-amber-600">COD not available for orders above ₹5,000</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(2)} disabled={processing}>Back</Button>
                  <Button onClick={handlePlaceOrder} isLoading={orderLoading || processing} disabled={orderLoading || processing}>
                    {processing ? 'Processing...' : `Place Order — ${formatPrice(total)}`}
                  </Button>
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
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
                  <span className="font-medium text-gray-900">{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span className="font-medium text-gray-900">{formatPrice(tax)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
