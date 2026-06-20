import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { formatDate, formatPrice, formatDateTime, classNames } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';
import adminService from '../../services/adminService';

const statusTabs = ['', 'pending', 'processing', 'completed', 'failed', 'cancelled'];

const statusBadgeVariant = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'danger',
  cancelled: 'secondary',
};

export default function AdminWithdrawalRequests() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [stats, setStats] = useState({ pending: 0, processing: 0, completed: 0, totalAmount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [approveModal, setApproveModal] = useState(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const perPage = 20;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page, limit: perPage, status: statusFilter || undefined };
      const res = await adminService.getWithdrawalRequests(params);
      setWithdrawals(res.withdrawals || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalItems(res.pagination?.totalItems || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminService.getWithdrawalStats();
      if (res) setStats(res);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { setPage(1); }, [statusFilter]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async () => {
    if (!approveModal || !transactionRef) return;
    setSubmitting(true);
    try {
      await adminService.approveWithdrawal(approveModal, transactionRef);
      setApproveModal(null);
      setTransactionRef('');
      fetchData();
      fetchStats();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setSubmitting(true);
    try {
      await adminService.rejectWithdrawal(rejectModal, rejectReason);
      setRejectModal(null);
      setRejectReason('');
      fetchData();
      fetchStats();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet><title>Withdrawal Requests | Admin | Zalnio</title></Helmet>

      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900">Withdrawal Requests</h1>
          <p className="text-gray-500 mt-1">Manage withdrawal requests from sellers and users</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Processing</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.processing || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-primary-600 mt-1">{formatPrice(stats.totalAmount || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {statusTabs.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={classNames('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors', statusFilter === status ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
            >
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
            </button>
          ))}
        </div>

        <Card padding={false}>
          {isLoading ? (
            <PageLoader />
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No withdrawal requests</h3>
              <p className="text-gray-500">All withdrawals have been processed</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {withdrawals.map(w => (
                      <tr key={w._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{w.user?.name || w.seller?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{w.user?.email || w.seller?.email || ''}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatPrice(w.amount || 0)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="info" size="xs">{w.method || w.paymentMethod || 'bank'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate" title={w.accountDetails?.accountNumber || w.accountNumber || '-'}>
                          {w.accountDetails?.accountNumber ? `xxxx${w.accountDetails.accountNumber.slice(-4)}` : w.accountNumber ? `xxxx${w.accountNumber.slice(-4)}` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant[w.status] || 'secondary'} size="xs">{w.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(w.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {(w.status === 'pending' || w.status === 'processing') && (
                              <>
                                <Button size="xs" variant="ghost" className="text-green-600" onClick={() => { setApproveModal(w._id); setTransactionRef(''); }} title="Approve">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </Button>
                                <Button size="xs" variant="ghost" className="text-red-600" onClick={() => { setRejectModal(w._id); setRejectReason(''); }} title="Reject">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
                  <span className="text-sm text-gray-600">Showing {((page - 1) * perPage) + 1}-{Math.min(page * perPage, totalItems)} of {totalItems}</span>
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

      <Modal isOpen={!!approveModal} onClose={() => { setApproveModal(null); setTransactionRef(''); }} title="Approve Withdrawal" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Enter transaction reference to confirm this withdrawal.</p>
          <Input label="Transaction Reference *" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} placeholder="TXN ID or reference number" />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => { setApproveModal(null); setTransactionRef(''); }}>Cancel</Button>
            <Button onClick={handleApprove} isLoading={submitting} disabled={!transactionRef.trim()}>Approve Withdrawal</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(''); }} title="Reject Withdrawal" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Provide a reason for rejecting this withdrawal request.</p>
          <Input label="Rejection Reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..." />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} isLoading={submitting}>Reject Withdrawal</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}