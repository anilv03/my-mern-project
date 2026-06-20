import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchUserPurchases } from '../../store/slices/adminSlice';
import { formatDate, formatPrice, classNames } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Loader';

const statusVariant = {
  pending: 'warning', confirmed: 'info', processing: 'primary',
  shipped: 'purple', delivered: 'success', cancelled: 'danger', refunded: 'secondary',
};

export default function AdminUserPurchases() {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const { userPurchases, isLoading, pagination } = useSelector(state => state.admin);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (userId) dispatch(fetchUserPurchases({ userId, params: { page } }));
  }, [dispatch, userId, page]);

  return (
    <>
      <Helmet><title>User Purchases | Admin | Zalnio</title></Helmet>
      <div>
        <div className="mb-6">
          <Link to="/admin/users" className="text-sm text-primary-600 hover:underline mb-2 inline-block">&larr; Back to Users</Link>
          <h1 className="text-2xl font-display font-bold text-gray-900">User Purchases</h1>
          <p className="text-gray-500 mt-1">Purchase history for user {userId?.slice(-8)}</p>
        </div>

        <Card padding={false}>
          {isLoading ? <PageLoader /> : userPurchases.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No purchases found</h3>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {userPurchases.map(order => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-primary-600">#{order.orderNumber || order._id?.slice(-8)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {order.items?.map(i => i.product?.title || i.title).join(', ') || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="info" size="xs">{order.orderType || 'digital'}</Badge>
                        </td>
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
    </>
  );
}
