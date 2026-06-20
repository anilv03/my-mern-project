import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchSellerOrders } from '../../store/slices/adminSlice';
import { formatDate, formatPrice, classNames } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';

const statusVariant = {
  pending: 'warning', confirmed: 'info', processing: 'primary',
  shipped: 'purple', delivered: 'success', cancelled: 'danger', refunded: 'secondary',
};

export default function AdminSellerOrders() {
  const dispatch = useDispatch();
  const { sellerOrders, isLoading, pagination } = useSelector(state => state.admin);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    dispatch(fetchSellerOrders({ page, status: statusFilter || undefined }));
  }, [dispatch, page, statusFilter]);

  return (
    <>
      <Helmet><title>Seller Orders | Admin | Zalnio</title></Helmet>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900">Seller Orders</h1>
          <p className="text-gray-500 mt-1">All orders containing seller items</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
          {['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
            <button key={status} onClick={() => { setStatusFilter(status); setPage(1); }}
              className={classNames('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                statusFilter === status ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >{status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}</button>
          ))}
        </div>

        <Card padding={false}>
          {isLoading ? <PageLoader /> : sellerOrders.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No seller orders found</h3>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sellerOrders.map(order => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <button onClick={() => setSelectedOrder(order)} className="text-sm font-medium text-primary-600 hover:underline">
                            #{order.orderNumber || order._id?.slice(-8)}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.user?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {order.items?.map(i => i.seller?.name).filter(Boolean).join(', ') || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.items?.length || 0}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatPrice(order.total || order.pricing?.total)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant[order.status] || 'secondary'} size="xs">{order.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination?.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-gray-600">Page {page} of {pagination.pages}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <Button variant="ghost" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder?._id?.slice(-8)}`} size="lg">
        {selectedOrder && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Customer: <strong>{selectedOrder.user?.name}</strong></p>
            <div className="space-y-2">
              {(selectedOrder.items || []).map((item, i) => (
                <div key={item._id || i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{item.product?.title || item.title}</p>
                    <p className="text-xs text-gray-500">Seller: {item.seller?.name} | Qty: {item.quantity || 1}</p>
                  </div>
                  <p className="text-sm font-medium">{formatPrice((item.price || 0) * (item.quantity || 1))}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button variant="secondary" onClick={() => setSelectedOrder(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
