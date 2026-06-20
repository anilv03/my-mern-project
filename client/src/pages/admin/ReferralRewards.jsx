import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import adminService from '../../services/adminService';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice, formatDate } from '../../lib/helpers';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  credited: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminReferralRewards() {
  const [rewards, setRewards] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchRewards(); }, [page]);

  const fetchRewards = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getPendingReferralRewards({ page, limit: 20 });
      setRewards(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
    } catch { setRewards([]); }
    setIsLoading(false);
  };

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await adminService.approveReferralReward(id);
      fetchRewards();
    } catch {}
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(true);
    try {
      await adminService.rejectReferralReward(rejectModal, rejectReason);
      setRejectModal(null);
      setRejectReason('');
      fetchRewards();
    } catch {}
    setActionLoading(false);
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Helmet><title>Referral Rewards - Admin | Zalnio</title></Helmet>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-gray-900">Referral Rewards</h1>
        <p className="text-gray-500 mt-1">Approve or reject first-purchase referral rewards (₹50)</p>
      </div>

      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Pending Rewards</h2></CardHeader>
        <CardBody padding={false}>
          {rewards.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No pending referral rewards</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-500">Referrer</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Referred</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Order</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rewards.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{r.referrer?.name || 'N/A'}<br /><span className="text-xs text-gray-400">{r.referrer?.email}</span></td>
                      <td className="px-4 py-3">{r.referred?.name || 'N/A'}<br /><span className="text-xs text-gray-400">{r.referred?.email}</span></td>
                      <td className="px-4 py-3">
                        {r.source?.order ? (
                          <span className="text-xs">{r.source.order.orderNumber}<br />{formatPrice(r.source.order.total)}</span>
                        ) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600">{formatPrice(r.amount)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(r.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-800'}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="xs" variant="outline" isLoading={actionLoading} onClick={() => handleApprove(r._id)}>Approve</Button>
                          <Button size="xs" variant="ghost" onClick={() => { setRejectModal(r._id); setRejectReason(''); }}>Reject</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`px-3 py-1 rounded text-sm ${page === p ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{p}</button>
          ))}
        </div>
      )}

      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Reward" size="sm">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Reason for rejection</label>
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} className="input-field w-full" placeholder="Optional reason..." />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button onClick={handleReject} isLoading={actionLoading}>Reject Reward</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
