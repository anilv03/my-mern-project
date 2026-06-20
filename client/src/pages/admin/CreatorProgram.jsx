import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { formatPrice, formatDate, classNames } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';
import adminService from '../../services/adminService';

const statusTabs = ['', 'pending', 'approved', 'rejected'];

const statusBadgeVariant = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

export default function AdminCreatorProgram() {
  const [rewards, setRewards] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, totalPaid: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [approveModal, setApproveModal] = useState(null);
  const [approveAmount, setApproveAmount] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const perPage = 20;

  useEffect(() => {
    fetchRewards();
  }, [page, statusFilter]);

  const fetchRewards = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getAllCreatorRewards({ page, limit: perPage, status: statusFilter || undefined });
      setRewards(res.rewards || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalItems(res.pagination?.totalItems || 0);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approveModal || !approveAmount) return;
    try {
      await adminService.reviewCreatorReward(approveModal, { status: 'approved', amount: Number(approveAmount) });
      setApproveModal(null);
      setApproveAmount('');
      fetchRewards();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await adminService.reviewCreatorReward(rejectModal, { status: 'rejected', reason: rejectReason });
      setRejectModal(null);
      setRejectReason('');
      fetchRewards();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Helmet><title>Creator Program - Admin | Zalnio</title></Helmet>

      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900">Creator Program</h1>
          <p className="text-gray-500 mt-1">Manage creator rewards and submissions</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Paid</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatPrice(stats.totalPaid || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {statusTabs.map(status => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={classNames(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                statusFilter === status ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
            </button>
          ))}
        </div>

        <Card padding={false}>
          {isLoading ? (
            <PageLoader />
          ) : rewards.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No creator rewards</h3>
              <p className="text-gray-500">No rewards match the current filter</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content URL</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rewards.map(reward => (
                      <tr key={reward._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{reward.user?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{reward.user?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="primary" size="xs">{reward.contentType || '-'}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {reward.contentUrl ? (
                            <a href={reward.contentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline truncate block max-w-[150px]">{reward.contentUrl}</a>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatPrice(reward.amount || 0)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant[reward.status] || 'secondary'} size="xs">{reward.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(reward.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {reward.status === 'pending' && (
                              <>
                                <Button size="xs" variant="ghost" className="text-green-600" onClick={() => { setApproveModal(reward._id); setApproveAmount(reward.amount || ''); }} title="Approve">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </Button>
                                <Button size="xs" variant="ghost" className="text-red-600" onClick={() => { setRejectModal(reward._id); setRejectReason(''); }} title="Reject">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-gray-600">
                    Showing {((page - 1) * perPage) + 1}-{Math.min(page * perPage, totalItems)} of {totalItems}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                    <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <Modal isOpen={!!approveModal} onClose={() => { setApproveModal(null); setApproveAmount(''); }} title="Approve Reward" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Set the reward amount for this creator submission.</p>
          <Input label="Reward Amount *" type="number" min="0" value={approveAmount} onChange={(e) => setApproveAmount(e.target.value)} />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => { setApproveModal(null); setApproveAmount(''); }}>Cancel</Button>
            <Button onClick={handleApprove} disabled={!approveAmount || Number(approveAmount) <= 0}>Approve Reward</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(''); }} title="Reject Reward" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Provide a reason for rejecting this submission.</p>
          <Input label="Reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Rejection reason..." />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="danger" onClick={handleReject}>Reject</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
