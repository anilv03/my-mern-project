import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { formatDate, formatPrice } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Card, { CardBody } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Loader';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

export default function DeliverySettlements() {
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [approvingId, setApprovingId] = useState(null);
  const perPage = 20;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getPendingSettlements({ page, limit: perPage });
      setSettlements(res.settlements || []);
      setTotalPages(res.pagination?.pages || 1);
      setTotalItems(res.pagination?.total || 0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load pending settlements');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (orderId, itemId) => {
    if (!window.confirm('Approve this settlement? 90% will be credited to the seller\'s wallet.')) return;
    setApprovingId(`${orderId}-${itemId}`);
    try {
      await adminService.approveSettlement(orderId, itemId);
      toast.success('Settlement approved successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve settlement');
    } finally {
      setApprovingId(null);
    }
  };

  if (isLoading && settlements.length === 0) return <PageLoader />;

  return (
    <>
      <Helmet><title>Delivery Settlements - Admin | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Delivery Settlements</h1>
            <p className="text-gray-500 mt-1">Approve seller payouts after delivery</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Pending Settlements</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{totalItems}</p>
            </CardBody>
          </Card>
        </div>

        {settlements.length === 0 ? (
          <Card className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No pending settlements</h3>
            <p className="text-gray-500">All delivered items have been settled</p>
          </Card>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Order</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Seller</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Total Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Tax (10%)</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Seller Gets (90%)</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Delivered At</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {settlements.map(s => (
                      <tr key={`${s._id}-${s.item._id}`} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-xs">{s.orderNumber}</td>
                        <td className="py-3 px-4 max-w-[200px] truncate">{s.item.title || s.product?.title}</td>
                        <td className="py-3 px-4">{s.seller?.name || 'N/A'}</td>
                        <td className="py-3 px-4 font-medium">{formatPrice(s.item.total)}</td>
                        <td className="py-3 px-4 text-red-600">{formatPrice(s.item.settlementTax)}</td>
                        <td className="py-3 px-4 font-medium text-green-600">{formatPrice(s.item.sellerEarning)}</td>
                        <td className="py-3 px-4 text-gray-600">{s.item.deliveredAt ? formatDate(s.item.deliveredAt) : '-'}</td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            isLoading={approvingId === `${s._id}-${s.item._id}`}
                            onClick={() => handleApprove(s._id, s.item._id)}
                          >
                            Approve
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}