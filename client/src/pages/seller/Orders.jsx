import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchSellerOrders, updateOrderStatus } from '../../store/slices/sellerSlice';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card, { CardBody } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { PageLoader } from '../../components/ui/Loader';
import Pagination from '../../components/ui/Pagination';
import { formatDate, formatDateTime, formatPrice, classNames } from '../../lib/helpers';

const statusTabs = [
  { value: '', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
];

const statusBadgeVariant = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'primary',
  shipped: 'purple',
  delivered: 'success',
  cancelled: 'danger',
  rejected: 'danger',
  refunded: 'secondary',
};

const getNextActions = (status) => {
  switch (status) {
    case 'pending': return [
      { value: 'confirmed', label: 'Accept', variant: 'primary' },
      { value: 'rejected', label: 'Reject', variant: 'danger' },
    ];
    case 'confirmed': return [
      { value: 'processing', label: 'Mark Packed', variant: 'primary' },
      { value: 'cancelled', label: 'Cancel', variant: 'danger' },
    ];
    case 'processing': return [
      { value: 'shipped', label: 'Mark Shipped', variant: 'primary' },
    ];
    case 'shipped': return [
      { value: 'delivered', label: 'Mark Delivered', variant: 'success' },
    ];
    default: return [];
  }
};

export default function SellerOrders() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, isLoading, pagination } = useSelector(state => state.seller);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, order: null, action: null });
  const [trackingInput, setTrackingInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');

  useEffect(() => {
    dispatch(fetchSellerOrders({ page, status: statusFilter || undefined }));
  }, [dispatch, page, statusFilter]);

  const handleBulkAction = useCallback(async (orderId, action) => {
    if (action === 'shipped') {
      setActionModal({ open: true, order: orderId, action });
      return;
    }
    if (action === 'rejected' || action === 'cancelled') {
      setActionModal({ open: true, order: orderId, action });
      return;
    }
    setUpdatingId(orderId);
    await dispatch(updateOrderStatus({ id: orderId, status: action }));
    setUpdatingId(null);
  }, [dispatch]);

  const confirmAction = useCallback(async () => {
    const { order: orderId, action } = actionModal;
    setUpdatingId(orderId);
    const payload = { status: action };
    if (action === 'shipped' && trackingInput.trim()) {
      payload.trackingNumber = trackingInput.trim();
    }
    if ((action === 'rejected' || action === 'cancelled') && reasonInput.trim()) {
      payload[action === 'rejected' ? 'rejectionReason' : 'cancelReason'] = reasonInput.trim();
    }
    await dispatch(updateOrderStatus({ id: orderId, ...payload }));
    setUpdatingId(null);
    setActionModal({ open: false, order: null, action: null });
    setTrackingInput('');
    setReasonInput('');
  }, [actionModal, trackingInput, reasonInput, dispatch]);

  const formatAddress = (addr) => {
    if (!addr) return 'N/A';
    const parts = [addr.street, addr.city, addr.state, addr.zip].filter(Boolean);
    return parts.join(', ') || 'N/A';
  };

  const getPaymentTypeLabel = (method) => {
    const labels = { razorpay: 'Razorpay', stripe: 'Stripe', cod: 'COD', wallet: 'Wallet' };
    return labels[method] || method || 'N/A';
  };

  return (
    <>
      <Helmet><title>Orders | Seller | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Orders</h1>
            <p className="text-gray-500 mt-1">Manage incoming orders for physical products</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {statusTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={classNames(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                statusFilter === tab.value
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
            <p className="text-gray-500">Orders will appear here once customers start purchasing</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order._id} padding={false}>
                <div className="divide-y divide-gray-100">
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary-600">
                            #{order.orderNumber}
                          </span>
                          <Badge variant={statusBadgeVariant[order.status] || 'secondary'} size="sm">
                            {order.status?.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="secondary" size="xs">
                            {getPaymentTypeLabel(order.payment?.method)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</p>
                        <p className="text-xs text-gray-500">{order.items?.length || 0} item(s)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Customer</p>
                        <p className="text-sm font-medium text-gray-900">{order.user?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{order.user?.email}</p>
                        {order.user?.phone && <p className="text-sm text-gray-600">{order.user.phone}</p>}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                        <p className="text-sm text-gray-900">
                          {order.shippingAddress?.phone || order.user?.phone || 'N/A'}
                        </p>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-2">Payment</p>
                        <p className="text-sm text-gray-900 capitalize">{getPaymentTypeLabel(order.payment?.method)}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Shipping Address</p>
                        {order.shippingAddress ? (
                          <>
                            <p className="text-sm text-gray-900">{order.shippingAddress.fullName || order.user?.name}</p>
                            <p className="text-sm text-gray-600">{order.shippingAddress.street}</p>
                            <p className="text-sm text-gray-600">
                              {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.zip].filter(Boolean).join(', ')}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">N/A</p>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Products</p>
                      <div className="space-y-2">
                        {order.items?.map(item => (
                          <div key={item._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                                {item.product?.images?.[0]?.url ? (
                                  <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="flex items-center justify-center h-full text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{item.title || item.product?.title || 'Product'}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity} x {formatPrice(item.price)}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <p className="text-sm font-semibold text-gray-900">{formatPrice(item.total)}</p>
                              {item.trackingNumber && (
                                <p className="text-xs text-gray-500">Tracking: {item.trackingNumber}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                      {getNextActions(order.status).map(action => (
                        <Button
                          key={action.value}
                          size="sm"
                          variant={action.variant}
                          isLoading={updatingId === order._id}
                          disabled={updatingId === order._id}
                          onClick={() => handleBulkAction(order._id, action.value)}
                        >
                          {action.label}
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/seller/orders/${order._id}/shipping-label`)}
                      >
                        Shipping Label
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/seller/orders/${order._id}/invoice`)}
                      >
                        Print Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {pagination?.totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      <Modal
        isOpen={actionModal.open}
        onClose={() => { setActionModal({ open: false, order: null, action: null }); setReasonInput(''); setTrackingInput(''); }}
        title={actionModal.action === 'shipped' ? 'Mark as Shipped' : `Confirm ${actionModal.action}`}
        size="sm"
      >
        <div className="space-y-4">
          {actionModal.action === 'shipped' && (
            <Input
              label="Tracking Number"
              placeholder="Enter tracking number..."
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
            />
          )}
          {(actionModal.action === 'rejected' || actionModal.action === 'cancelled') && (
            <Input
              label={actionModal.action === 'rejected' ? 'Rejection Reason' : 'Cancellation Reason'}
              placeholder="Enter reason..."
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
            />
          )}
          {actionModal.action === 'shipped' && (
            <p className="text-sm text-gray-500">Provide a tracking number to mark this order as shipped.</p>
          )}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => { setActionModal({ open: false, order: null, action: null }); setReasonInput(''); setTrackingInput(''); }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              isLoading={updatingId === actionModal.order}
              onClick={confirmAction}
              disabled={
                (actionModal.action === 'shipped' && !trackingInput.trim()) ||
                ((actionModal.action === 'rejected' || actionModal.action === 'cancelled') && !reasonInput.trim())
              }
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
