import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchOrders } from '../../store/slices/orderSlice';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Loader';
import Pagination from '../../components/ui/Pagination';
import { formatDate, formatDateTime, formatPrice, classNames } from '../../lib/helpers';
import { PHYSICAL_PRODUCTS } from '../../lib/constants';

const statusVariant = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'primary',
  shipped: 'purple',
  delivered: 'success',
  cancelled: 'danger',
  rejected: 'danger',
};

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STATUS_LABELS = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
];

export default function MyPhysicalOrders() {
  const dispatch = useDispatch();
  const { orders, isLoading, pagination } = useSelector(state => state.orders);
  const [activeTab, setActiveTab] = useState('');
  const [page, setPage] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    const params = { page, limit: 10 };
    if (activeTab) params.status = activeTab;
    dispatch(fetchOrders(params));
  }, [dispatch, page, activeTab]);

  const physicalOrders = orders.filter(order => {
    const isPhysical = order.items?.some(item => {
      const type = typeof item.product === 'object' ? item.product?.productType : '';
      return PHYSICAL_PRODUCTS.includes(type);
    });
    return isPhysical || (!order.isDigitalOnly && order.orderType !== 'digital');
  });

  const currentStatusIndex = (status) => STATUS_FLOW.indexOf(status);

  const getTimeline = (order) => {
    const idx = currentStatusIndex(order.status);
    const activeStatuses = STATUS_FLOW.slice(0, idx + 1);
    return activeStatuses.map(s => ({
      status: s,
      label: STATUS_LABELS[s] || s,
      timestamp: order.statusHistory?.find(h => h.status === s)?.timestamp || order.createdAt,
    }));
  };

  const getPaymentLabel = (method) => {
    const labels = { razorpay: 'Razorpay', stripe: 'Stripe', cod: 'COD', wallet: 'Wallet' };
    return labels[method] || method || 'N/A';
  };

  const handleTabChange = (status) => {
    setActiveTab(status);
    setPage(1);
    setExpandedOrder(null);
  };

  return (
    <>
      <Helmet><title>My Physical Orders | Zalnio</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">My Physical Orders</h1>
          <p className="text-gray-500 mt-1">Track and manage your physical product orders.</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {statusTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={classNames(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <PageLoader />
        ) : physicalOrders.length === 0 ? (
          <Card className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No physical orders yet</h3>
            <p className="text-gray-500 mb-6">Purchase physical books to see them here.</p>
            <Link to="/products"><Button variant="primary">Browse Products</Button></Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {physicalOrders.map(order => {
              const isExpanded = expandedOrder === order._id;
              const timeline = getTimeline(order);
              const idx = currentStatusIndex(order.status);
              return (
                <Card key={order._id} padding={false}>
                  <div
                    className="p-4 sm:p-6 cursor-pointer"
                    onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-primary-600">
                            #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
                          </span>
                          <Badge variant={statusVariant[order.status] || 'secondary'} size="sm">
                            {STATUS_LABELS[order.status] || order.status?.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="secondary" size="xs">
                            {getPaymentLabel(order.payment?.method)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'} &middot; {formatDate(order.createdAt)}
                        </p>
                        {order.trackingNumber && (
                          <p className="text-xs text-gray-400 mt-1">Tracking: {order.trackingNumber}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</span>
                        <svg
                          className={classNames(
                            'w-5 h-5 text-gray-400 transition-transform',
                            isExpanded && 'rotate-180'
                          )}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {order.shippingAddress && (
                      <div className="mt-3 text-xs text-gray-500">
                        <span className="font-medium">Ship to:</span>{' '}
                        {[
                          order.shippingAddress.fullName,
                          order.shippingAddress.street,
                          order.shippingAddress.city,
                          order.shippingAddress.state,
                          order.shippingAddress.zip,
                        ].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      <div className="p-4 sm:p-6 space-y-6">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Order Timeline</h4>
                          <div className="relative">
                            {timeline.map((step, i) => {
                              const isLast = i === timeline.length - 1;
                              return (
                                <div key={step.status} className="flex items-start gap-3 pb-4 last:pb-0 relative">
                                  {!isLast && (
                                    <div className="absolute left-[11px] top-5 w-0.5 h-full bg-primary-200" />
                                  )}
                                  <div className={classNames(
                                    'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                                    'bg-primary-600'
                                  )}>
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{step.label}</p>
                                    <p className="text-xs text-gray-500">{formatDateTime(step.timestamp)}</p>
                                  </div>
                                </div>
                              );
                            })}
                            {order.status === 'cancelled' || order.status === 'rejected' ? (
                              <div className="flex items-start gap-3 pb-4 relative">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-red-500">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-red-600">
                                    {order.status === 'rejected' ? 'Rejected' : 'Cancelled'}
                                  </p>
                                  {order.cancelReason && (
                                    <p className="text-xs text-gray-500">Reason: {order.cancelReason}</p>
                                  )}
                                  <p className="text-xs text-gray-500">{formatDateTime(order.cancelledAt)}</p>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Items</h4>
                          <div className="space-y-2">
                            {order.items?.map((item, idx) => {
                              const product = typeof item.product === 'object' ? item.product : {};
                              return (
                                <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                                      {product.images?.[0]?.url ? (
                                        <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{item.title || product.title || 'Product'}</p>
                                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-3">
                                    <p className="text-sm font-semibold text-gray-900">{formatPrice(item.total || item.price * item.quantity)}</p>
                                    {item.trackingNumber && (
                                      <p className="text-xs text-gray-400">ID: {item.trackingNumber}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/orders/${order._id}`}>
                            <Button size="sm" variant="outline">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              View Details
                            </Button>
                          </Link>
                          {order.status === 'shipped' || order.status === 'delivered' ? (
                            <a
                              href={`/api/v1/orders/${order._id}/track/${order.orderNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="ghost">Track Package</Button>
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {pagination?.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => { setPage(p); setExpandedOrder(null); }}
            />
          </div>
        )}
      </div>
    </>
  );
}
