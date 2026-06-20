import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchOrders } from '../../store/slices/orderSlice';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Loader';
import { formatDate, formatPrice, classNames, getOrderStatusColor } from '../../lib/helpers';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function OrderHistory() {
  const dispatch = useDispatch();
  const { orders, isLoading, pagination } = useSelector(state => state.orders);
  const [activeTab, setActiveTab] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = { page, limit: 10 };
    if (activeTab) params.status = activeTab;
    dispatch(fetchOrders(params));
  }, [dispatch, page, activeTab]);

  const handleTabChange = (status) => {
    setActiveTab(status);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Helmet><title>My Orders | Zalnio</title></Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 mt-1">View and manage your orders</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {STATUS_TABS.map(tab => (
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
        ) : orders.length === 0 ? (
          <Card className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
            <p className="text-gray-500 mb-6">
              {activeTab ? `No ${activeTab} orders yet` : "You haven't placed any orders yet"}
            </p>
            <Link to="/products">
              <Button variant="primary">Start Shopping</Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map(order => (
                <Link key={order._id} to={`/orders/${order._id}`}>
                  <Card className="hover:border-primary-200 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-semibold text-gray-900">
                            #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                          </span>
                          <Badge variant={getOrderStatusColor(order.status).split(' ')[0].replace('bg-', '')} size="xs">
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'} | {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</span>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {pagination?.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="ghost"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </Button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === pagination.totalPages)
                  .map((p, i, arr) => (
                    <span key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 text-gray-400">...</span>}
                      <button
                        onClick={() => handlePageChange(p)}
                        className={classNames(
                          'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                          p === page ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <Button
                  variant="ghost"
                  disabled={page >= pagination.totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
