import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { formatPrice, formatDate, classNames } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';
import adminService from '../../services/adminService';

const statusTabs = ['', 'pending', 'approved', 'rejected'];

const statusBadgeVariant = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

export default function AdminRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
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
    fetchRefunds();
  }, [page, statusFilter]);

  const fetchRefunds = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getRefunds({ page, limit: perPage, returnStatus: statusFilter || undefined });
      setRefunds(res.refunds || []);
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
      await adminService.approveRefund(approveModal, Number(approveAmount));
      setApproveModal(null);
      setApproveAmount('');
      fetchRefunds();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await adminService.rejectRefund(rejectModal, rejectReason);
      setRejectModal(null);
      setRejectReason('');
      fetchRefunds();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Helmet><title>Refund Requests - Admin | Zalnio</title></Helmet>

      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900">Refund Requests</h1>
          <p className="text-gray-500 mt-1">Manage return and refund requests</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
          ) : refunds.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No refund requests</h3>
              <p className="text-gray-500">All clear, no pending refunds</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {refunds.map(refund => (
                      <tr key={refund._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-primary-600">#{refund.order?._id?.slice(-8) || refund.orderId?.slice(-8)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{refund.user?.name || refund.userId?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatPrice(refund.amount || 0)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={refund.reason}>{refund.reason || '-'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant[refund.status] || 'secondary'} size="xs">{refund.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(refund.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {refund.status === 'pending' && (
                              <>
                                <Button size="xs" variant="ghost" className="text-green-600" onClick={() => { setApproveModal(refund._id); setApproveAmount(refund.amount || ''); }} title="Approve">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </Button>
                                <Button size="xs" variant="ghost" className="text-red-600" onClick={() => { setRejectModal(refund._id); setRejectReason(''); }} title="Reject">
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

      <Modal isOpen={!!approveModal} onClose={() => { setApproveModal(null); setApproveAmount(''); }} title="Approve Refund" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Enter the refund amount to approve.</p>
          <Input label="Refund Amount *" type="number" min="0" value={approveAmount} onChange={(e) => setApproveAmount(e.target.value)} />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => { setApproveModal(null); setApproveAmount(''); }}>Cancel</Button>
            <Button variant="primary" onClick={handleApprove} disabled={!approveAmount || Number(approveAmount) <= 0}>Approve Refund</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(''); }} title="Reject Refund" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Provide a reason for rejecting this refund request.</p>
          <Input label="Rejection Reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason..." />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="danger" onClick={handleReject}>Reject Refund</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
