import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchOrderById, cancelOrder, clearCurrentOrder } from '../../store/slices/orderSlice';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { PageLoader } from '../../components/ui/Loader';
import { formatDate, formatDateTime, formatPrice, classNames, getOrderStatusColor } from '../../lib/helpers';
import { DIGITAL_PRODUCTS } from '../../lib/constants';

const STATUS_HISTORY = [
  { status: 'pending', label: 'Order Placed', icon: 'M9 5l7 7-7 7' },
  { status: 'confirmed', label: 'Confirmed', icon: 'M5 13l4 4L19 7' },
  { status: 'processing', label: 'Processing', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { status: 'shipped', label: 'Shipped', icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
  { status: 'delivered', label: 'Delivered', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const ORDER_STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentOrder: order, isLoading } = useSelector(state => state.orders);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    dispatch(fetchOrderById(id));
    return () => dispatch(clearCurrentOrder());
  }, [dispatch, id]);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Please provide a reason for cancellation');
      return;
    }
    setIsCancelling(true);
    await dispatch(cancelOrder({ id, reason: cancelReason }));
    setIsCancelling(false);
    setShowCancelModal(false);
    setCancelReason('');
  };

  const handleReturnRequest = () => {
    setShowReturnModal(false);
    setReturnReason('');
  };

  if (isLoading || !order) return <PageLoader />;

  const isDigitalOnly = order.isDigitalOnly ?? order.items?.every(item => {
    const type = typeof item.product === 'object' ? item.product?.productType : '';
    return DIGITAL_PRODUCTS.includes(type);
  }) ?? false;
  const canCancel = !isDigitalOnly && ['pending', 'confirmed'].includes(order.status);
  const canRequestReturn = !isDigitalOnly && order.status === 'delivered';
  const currentStatusIndex = ORDER_STATUS_FLOW.indexOf(order.status);

  return (
    <>
      <Helmet><title>Order #{order.orderNumber || order._id.slice(-8).toUpperCase()} | Zalnio</title></Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <Link to="/orders" className="hover:text-primary-600">My Orders</Link>
          <span>/</span>
          <span className="text-gray-900">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Placed on {formatDateTime(order.createdAt)}</p>
                  </div>
                  <Badge variant={getOrderStatusColor(order.status).split(' ')[0].replace('bg-', '')} size="md">
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>

              <CardBody>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Order Timeline</h3>
                <div className="relative">
                  {STATUS_HISTORY.map((step, idx) => {
                    const isCompleted = currentStatusIndex >= idx;
                    const isCurrent = currentStatusIndex === idx;
                    return (
                      <div key={step.status} className="flex items-start gap-4 pb-6 last:pb-0 relative">
                        {idx < STATUS_HISTORY.length - 1 && (
                          <div className={classNames(
                            'absolute left-[15px] top-8 w-0.5 h-full -translate-x-1/2',
                            isCompleted ? 'bg-primary-500' : 'bg-gray-200'
                          )} />
                        )}
                        <div className={classNames(
                          'relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          isCompleted ? 'bg-primary-600' : 'bg-gray-200'
                        )}>
                          {isCompleted ? (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                          )}
                        </div>
                        <div className="pt-1.5">
                          <p className={classNames(
                            'text-sm font-medium',
                            isCurrent ? 'text-primary-700' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                          )}>
                            {step.label}
                          </p>
                          {isCurrent && order.statusTimeline?.[step.status] && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDateTime(order.statusTimeline[step.status])}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Items</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {order.items?.map((item, idx) => {
                    const product = item.product || {};
                    const title = item.title || product.title || '';
                    const image = item.image || product.images?.[0]?.url || '';
                    const productId = typeof product === 'object' ? product._id : product;
                    return (
                      <div key={productId || idx} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                          <Link to={`/products/${product.slug || productId}`} className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block">
                            {title}
                          </Link>
                          <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                          {item.status && (
                            <Badge variant={getOrderStatusColor(item.status).split(' ')[0].replace('bg-', '')} size="xs">
                              {item.status}
                            </Badge>
                          )}
                          {DIGITAL_PRODUCTS.includes(product.productType) && (
                            <div className="mt-2">
                              {product.digitalFile?.courseVideos?.length > 0 ? (
                                <Link to={`/my-learning?product=${productId}`}>
                                  <Button size="xs" variant="primary">Watch Now</Button>
                                </Link>
                              ) : product.digitalFile?.fileUrl ? (
                                <a href={product.digitalFile.fileUrl} download target="_blank" rel="noopener noreferrer">
                                  <Button size="xs" variant="outline">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download {product.digitalFile?.fileType?.toUpperCase() || 'File'}
                                  </Button>
                                </a>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">{formatPrice(order.subtotal || 0)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span className="font-medium">-{formatPrice(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium text-gray-900">{order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span className="font-medium text-gray-900">{formatPrice(order.tax)}</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between text-base font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Shipping Address</h3>
              </CardHeader>
              <CardBody>
                {order.shippingAddress ? (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.street}</p>
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}</p>
                    <p className="mt-1">{order.shippingAddress.phone}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Digital product — no shipping required</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Payment Info</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Method</span>
                    <span className="font-medium text-gray-900 capitalize">{order.paymentMethod || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <Badge
                      variant={order.paymentStatus === 'captured' || order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'failed' ? 'danger' : 'warning'}
                      size="xs"
                    >
                      {order.paymentStatus || 'Pending'}
                    </Badge>
                  </div>
                  {order.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transaction ID</span>
                      <span className="font-medium text-gray-900 text-xs truncate max-w-[140px]">{order.transactionId}</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            <div className="flex flex-col gap-3">
              {canCancel && (
                <Button variant="danger" fullWidth onClick={() => setShowCancelModal(true)}>
                  Cancel Order
                </Button>
              )}
              {canRequestReturn && (
                <Button variant="outline" fullWidth onClick={() => setShowReturnModal(true)}>
                  Request Return
                </Button>
              )}
              <Link to="/orders">
                <Button variant="ghost" fullWidth>Back to Orders</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showCancelModal} onClose={() => { setShowCancelModal(false); setCancelError(''); }} title="Cancel Order" size="md">
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to cancel this order? This action cannot be undone.
        </p>
        <div className="space-y-1">
          <Input
            label="Reason for cancellation"
            name="cancelReason"
            value={cancelReason}
            onChange={(e) => { setCancelReason(e.target.value); setCancelError(''); }}
            placeholder="Please tell us why you're cancelling..."
            error={cancelError}
          />
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="ghost" fullWidth onClick={() => { setShowCancelModal(false); setCancelError(''); }}>Keep Order</Button>
          <Button variant="danger" fullWidth onClick={handleCancelOrder} isLoading={isCancelling}>Yes, Cancel Order</Button>
        </div>
      </Modal>

      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title="Request Return" size="md">
        <p className="text-sm text-gray-600 mb-4">
          Please tell us why you'd like to return this order.
        </p>
        <Input
          label="Return reason"
          name="returnReason"
          value={returnReason}
          onChange={(e) => setReturnReason(e.target.value)}
          placeholder="Describe the issue..."
        />
        <div className="flex gap-3 mt-6">
          <Button variant="ghost" fullWidth onClick={() => setShowReturnModal(false)}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={handleReturnRequest}>Submit Return Request</Button>
        </div>
      </Modal>
    </>
  );
}
